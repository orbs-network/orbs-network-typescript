"use strict";

const _ = require("lodash");
const AWS = require("aws-sdk");
const shell = require("shelljs");
const fs = require("fs");
const nconf = require("nconf");

const { REGION, NETWORK, DNS_ZONE, ACCOUNT_ID } = process.env;

const argsConfig = {
    parseValues: true
};

const config = nconf.env(argsConfig).argv(argsConfig);

const setParameter = (params, key, value) => {
    const param = _.find(params, p => p.ParameterKey === key);

    if (param) {
        param.ParameterValue = value;
    } else {
        params.push({
            "ParameterKey": key,
            "ParameterValue": value
        })
    }
};

const CF_STACK_STATUS = [
    "CREATE_IN_PROGRESS",
    "CREATE_FAILED",
    "CREATE_COMPLETE",
    "ROLLBACK_IN_PROGRESS",
    "ROLLBACK_FAILED",
    "ROLLBACK_COMPLETE",
    "DELETE_IN_PROGRESS",
    "DELETE_FAILED",
    "UPDATE_IN_PROGRESS",
    "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",
    "UPDATE_COMPLETE",
    "UPDATE_ROLLBACK_IN_PROGRESS",
    "UPDATE_ROLLBACK_FAILED",
    "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
    "UPDATE_ROLLBACK_COMPLETE",
    "CREATE_COMPLETE"
];

const getStacks = (cloudFormation) => new Promise((resolve, reject) => {
    cloudFormation.listStacks({ StackStatusFilter: CF_STACK_STATUS }, (err, data) => {
        if (err) return reject(err);

        const stacks = data.StackSummaries;

        console.log(`Found ${stacks.length} stack${stacks.length > 1 ? "s" : ""}: ${_.map(stacks, "StackName").join(", ")}`);
        resolve(stacks);
    });
});

// confition is a function that returns true or false
const waitForStacks = (cloudFormation, condition) => new Promise((resolve, reject) => {
    const start = new Date().getTime();

    const interval = setInterval(() => {
        console.log("Waiting for CloudFormation to meet the condition...");

        // Reject after 5 minutes
        if ((new Date().getTime() - start) / 1000 > 60 * 5) {
            reject("Timed out");
        }

        getStacks(cloudFormation).then(stacks => {
            if (condition(stacks)) {
                clearInterval(interval);
                resolve();
            }
        }).catch(reject);
    }, 5000);
});

const uploadBootstrap = (options) => {
    const { s3Path, localPath } = options.parity ? { s3Path: "parity", localPath: "parity" } : { s3Path: "v1", localPath: "bootstrap" };
    shell.exec(`aws s3 sync ${__dirname}/../${localPath}/ s3://${options.bucketName}-${options.NODE_ENV}-${options.region}/${s3Path}/`);
};

const getDockerImageName = (options) => {
    return `${options.accoundId}.dkr.ecr.${options.region}.amazonaws.com/orbs-network-${options.NODE_ENV}-${options.region}`;
};

const getDefaultDockerImageTag = () => {
    return shell.exec("git rev-parse --abbrev-ref HEAD").stdout.replace(/\//g, "-").trim();
};

const pushDockerImage = (options) => {
    const dockerImage = getDockerImageName(options);

    shell.exec(`$(aws ecr get-login --no-include-email --region ${options.region})`);
    shell.exec(`docker push ${dockerImage}`);
};

const tagDockerImage = (options) => {
    const defaultImage = "orbs";
    const defaultTag = getDefaultDockerImageTag(options);
    const dockerImage = getDockerImageName(options);
    const dockerTag = options.dockerTag || defaultTag;

    console.log(`docker tag ${defaultImage}:${defaultTag} ${dockerImage}:${dockerTag}`);
    shell.exec(`docker tag ${defaultImage}:${defaultTag} ${dockerImage}:${dockerTag}`);
};

const createStack = (cloudFormation, stackName, templatePath, parameters) => new Promise((resolve, reject) => {
    const templateBody = fs.readFileSync(templatePath).toString();

    return new Promise((resolve, reject) => {
        cloudFormation.createStack({
            StackName: stackName,
            Parameters: parameters,
            TemplateBody: templateBody,
            Capabilities: ["CAPABILITY_NAMED_IAM"]
        }, (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });
});

const removeStack = (cloudFormation, stackName) => new Promise((resolve, reject) => {
    cloudFormation.deleteStack({ StackName: stackName }, (err, data) => {
        err ? reject(err) : resolve(data);
    });
});

const main = (options) => {
    const cloudFormation = new AWS.CloudFormation({ region: options.region });

    const keyName = `orbs-network-${options.NODE_ENV}-key`;

    if (options.sshPublicKey) {
        shell.exec(`aws ec2 import-key-pair \
            --key-name ${keyName} \
            --public-key-material "$(cat ${options.sshPublicKey})" \
            --region ${options.region}
            `);
    }

    const basicInfrastructureStackName = `basic-infrastructure-${options.network}`;

    if (options.createBasicInfrastructure) {
        console.log(`Creating basic infrastructure...`);

        const basicInfrastructureParams = [{
            "ParameterKey": "NodeEnv",
            "ParameterValue": options.NODE_ENV
        }];

        if (options.dnsZone) {
            setParameter(basicInfrastructureParams, "DNSZone", options.dnsZone);
        }

        if (options.bucketName) {
            setParameter(basicInfrastructureParams, "BucketName", options.bucketName);
        }

        createStack(cloudFormation, basicInfrastructureStackName, `${__dirname}/../cloudformation/basic-infrastructure.yaml`, basicInfrastructureParams).catch((err) => {
            console.error(err);
            process.exit(1);
        });
    }

    waitForStacks(cloudFormation, (stacks) => {
        return _.isObject(_.find(stacks, (s) => s.StackName === basicInfrastructureStackName && s.StackStatus === "CREATE_COMPLETE"));
    }).then(() => {
        if (options.tagDockerImage) {
            tagDockerImage(options);
        }

        if (options.pushDockerImage) {
            console.log(`Pushing docker image...`);
            pushDockerImage(options);
        }

        const stackName = `${options.parity ? "ethereum" : "orbs"}-network-${options.network}`;

        if (options.deployNode || options.updateConfiguration) {
            console.log(`Uploading bootstrap files...`);
            uploadBootstrap(options);
        }

        if (options.deployNode) {
            console.log(`Uploading bootstrap files...`);
            uploadBootstrap(options);

            if (options.removeNode) {
                console.log(`Removing old node...`);
                removeStack(cloudFormation, stackName);
            }

            waitForStacks(cloudFormation, (stacks) => {
                // TODO: fix to accommodate both parity node and regular node
                console.log(stacks);
                const nodeStack = _.find(stacks, {StackName: stackName});
                return _.isEmpty(nodeStack);
            }).then(() => {
                console.log(`Deploying new node...`);

                const paramsFileName = options.parity ? "parameters.parity.json" : "parameters.node.json";

                const standaloneParams = JSON.parse(fs.readFileSync(`${__dirname}/../cloudformation/${paramsFileName}`).toString());
                setParameter(standaloneParams, "NodeEnv", options.NODE_ENV);
                setParameter(standaloneParams, "KeyName", keyName);
                setParameter(standaloneParams, "DockerTag", options.dockerTag || getDefaultDockerImageTag(options));

                if (options.nodes) {
                    setParameter("NumOfNodes", options.numOfNodes);
                }

                createStack(cloudFormation, stackName, `${__dirname}/../cloudformation/node.yaml`, standaloneParams);

                const hostname = options.parity ? `ethereum.${options.region}.global.services` : `${options.region}.global.nodes`;

                console.log(`ssh -o StrictHostKeyChecking=no ec2-user@${hostname}.${options.NODE_ENV}.${options.dnsZone}`);
            });
        }
    });
};

main({
    region: config.get("region"),
    network: config.get("network"),
    accoundId: config.get("account-id"),
    NODE_ENV: config.get("network") == "mainnet" ? "production" : "staging",
    dnsZone: config.get("dns-zone"),
    sshPublicKey: config.get("ssh-public-key"),
    createBasicInfrastructure: config.get("create-basic-infrastructure"),
    bucketName: config.get("s3-bucket-name"),
    pushDockerImage: config.get("push-docker-image"),
    tagDockerImage: config.get("tag-docker-image"),
    numOfNodes: config.get("nodes"),
    dockerTag: config.get("docker-tag"),
    deployNode: config.get("deploy-node"),
    removeNode: config.get("removeNode"),
    updateConfiguration: config.get("update-configuration"),
    parity: config.get("parity")
});
