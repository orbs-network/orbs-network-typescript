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

        console.log(`Found ${stacks.length} stacks: ${_.map(stacks, "StackName").join(", ")}`);
        resolve(stacks);
    });
});

// confition is a function that returns true or false
const waitForStacks = (cloudFormation, condition) => new Promise((resolve, reject) => {
    const interval = setInterval(() => {
        console.log("Waiting for CloudFormation to meet the condition...");
        getStacks(cloudFormation).then(stacks => {
            if (condition(stacks)) {
                clearInterval(interval);
                resolve();
            }
        }).catch(reject);
    }, 5000);
});

const uploadBootstrap = (options) => {
    shell.exec(`aws s3 sync ${__dirname}/../bootstrap/ s3://${options.bucketName}-${options.NODE_ENV}-${options.region}/v1/`);
};

const pushDockerImage = (options) => {
    const dockerImage = `${options.accoundId}.dkr.ecr.${options.region}.amazonaws.com/orbs-network-${options.NODE_ENV}-${options.region}`;

    shell.exec(`$(aws ecr get-login --no-include-email --region ${options.region})`);
    shell.exec(`docker push ${dockerImage}`);
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

        createStack(cloudFormation, basicInfrastructureStackName, "./basic-infrastructure.yaml", basicInfrastructureParams).catch(process.exit);
    }

    waitForStacks(cloudFormation, (stacks) => {
        return _.isObject(_.find(stacks, (s) => s.StackName === basicInfrastructureStackName && s.StackStatus === "CREATE_COMPLETE"));
    }).then(() => {
        console.log(`Uploading bootstrap files...`);
        uploadBootstrap(options);

        if (options.pushDockerImage) {
            console.log(`Pushing docker image...`);
            pushDockerImage(options);
        }

        const stackName = `orbs-network-${options.network}`;

        if (options.deployNode) {
            if (options.removeNode) {
                console.log(`Removing old node...`);
                removeStack(cloudFormation, stackName);
            }

            waitForStacks(cloudFormation, (stacks) => {
                return _.size(stacks) === 1;
            }).then(() => {
                console.log(`Deploying new node...`);

                const standaloneParams = JSON.parse(fs.readFileSync("./parameters.standalone.json").toString());
                setParameter(standaloneParams, "NodeEnv", options.NODE_ENV);
                setParameter(standaloneParams, "KeyName", keyName);

                createStack(cloudFormation, stackName, "./cloudformation.yaml", standaloneParams);

                console.log(`ssh -o StrictHostKeyChecking=no ec2-user@${options.region}.global.nodes.${options.NODE_ENV}.${options.dnsZone}`);
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
    deployNode: config.get("deploy-node"),
    removeNode: config.get("removeNode")
});
