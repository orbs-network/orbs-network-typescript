"use strict";

const _ = require("lodash");
const AWS = require("aws-sdk");
const shell = require("shelljs");
const fs = require("fs");
const nconf = require("nconf");

const { REGION, NETWORK, DNS_ZONE } = process.env;

const argsConfig = {
  parseValues: true
};

export const config = nconf.env(argsConfig).argv(argsConfig);

function setParameter(params: any, key: string, value: string | number) {
  const param = _.find(params, (p: any) => p.ParameterKey === key);

  if (param) {
    param.ParameterValue = value;
  } else {
    params.push({
      "ParameterKey": key,
      "ParameterValue": value
    });
  }
}

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

function getStacks(cloudFormation: any, region: any) {
  return new Promise((resolve, reject) => {
    cloudFormation.listStacks({ StackStatusFilter: CF_STACK_STATUS }, (err: Error, data: any) => {
      if (err) return reject(err);

      const stacks = data.StackSummaries;

      console.log(`Found ${stacks.length} stack${stacks.length > 1 ? "s" : ""} in ${region}: ${_.map(stacks, "StackName").join(", ")}`);
      resolve(stacks);
    });
  });
}

// confition is a function that returns true or false
function waitForStacks(cloudFormation: any, region: any, condition: any) {
  return new Promise((resolve, reject) => {
    const start = new Date().getTime();

    const interval = setInterval(() => {
      console.log(`Waiting for CloudFormation to meet the condition in ${region}...`);

      // Reject after 5 minutes
      if ((new Date().getTime() - start) / 1000 > 60 * 5) {
        reject("Timed out");
      }

      getStacks(cloudFormation, region).then(stacks => {
        if (condition(stacks)) {
          clearInterval(interval);
          resolve();
        }
      }).catch(reject);
    }, 5000);
  });
}

function uploadBootstrap(options: any) {
  const { s3Path, localPath } = options.parity ? { s3Path: "parity", localPath: "parity" } : { s3Path: "v1", localPath: "bootstrap" };
  shell.exec(`${getAWSCredentialsAsEnvVars(options)} aws s3 sync ${__dirname}/../${localPath}/ s3://${options.bucketName}-${options.NODE_ENV}-${options.region}/${s3Path}/`);
}

function getDockerImageName(options: any) {
  return `${options.accountId}.dkr.ecr.${options.region}.amazonaws.com/orbs-network-${options.NODE_ENV}-${options.region}`;
}

function getDefaultDockerImageTag() {
  return shell.exec("git rev-parse --abbrev-ref HEAD").stdout.replace(/\//g, "-").trim();
}

function pushDockerImage(options: any) {
  const dockerImage = getDockerImageName(options);

  shell.exec(`$(${getAWSCredentialsAsEnvVars(options)} aws ecr get-login --no-include-email --region ${options.region})`);
  shell.exec(`docker push ${dockerImage}`);
}

function tagDockerImage(options: any) {
  const defaultImage = "orbs";
  const defaultTag = getDefaultDockerImageTag();
  const dockerImage = getDockerImageName(options);
  const dockerTag = options.dockerTag || defaultTag;

  console.log(`docker tag ${defaultImage}:${dockerTag} ${dockerImage}:${dockerTag}`);
  shell.exec(`docker tag ${defaultImage}:${dockerTag} ${dockerImage}:${dockerTag}`);
}

function stackAction(action: string, cloudFormation: any, stackName: string, templateBody: string, parameters: any) {
  return new Promise((resolve, reject) => {
    cloudFormation[action]({
      StackName: stackName,
      Parameters: parameters,
      TemplateBody: templateBody,
      Capabilities: ["CAPABILITY_NAMED_IAM"]
    }, (err: Error, data: any) => {
      err ? reject(err) : resolve(data);
    });
  });
}

function describeStack(cloudFormation: any, stackName: string) {
  return new Promise((resolve, reject) => {
    cloudFormation.describeStacks({ StackName: stackName }, (err: Error, data: any) => {
      err ? reject(err) : resolve(data);
    });
  });
}

function removeStack(cloudFormation: any, stackName: string) {
  return new Promise((resolve, reject) => {
    cloudFormation.deleteStack({ StackName: stackName }, (err: Error, data: any) => {
      err ? reject(err) : resolve(data);
    });
  });
}

function getElasticIp(ec2: any, allocationIds: string[]) {
  return new Promise((resolve, reject) => {
    ec2.describeAddresses({ AllocationIds: allocationIds }, (err: Error, data: any) => {
      err ? reject(err) : resolve(data);
    });
  });
}

function getAWSCredentialsAsEnvVars(options: any) {
  if (!options.credentials) {
    return "";
  }

  return `export AWS_SECRET_ACCESS_KEY=${options.credentials.secretAccessKey} AWS_ACCESS_KEY_ID=${options.credentials.accessKeyId} &&`;
}

export async function execute(options: any) {
  console.log(`Deploying to ${options.region}`);


  const awsParams: any = { region: options.region };
  if (options.credentials) {
    awsParams.accessKeyId = options.credentials.accessKeyId;
    awsParams.secretAccessKey = options.credentials.secretAccessKey;
  }

  const cloudFormation = new AWS.CloudFormation(awsParams);
  const ec2 = new AWS.EC2(awsParams);

  // TODO: get rid of hardcoded key name
  const keyName = `orbs-network-${options.NODE_ENV}-key`;

  if (options.sshPublicKey) {
    shell.exec(`${getAWSCredentialsAsEnvVars(options)} \
    aws ec2 import-key-pair \
            --key-name ${keyName} \
            --public-key-material "$(cat ${options.sshPublicKey})" \
            --region ${options.region}
            `);
  }

  const basicInfrastructureStackName = `basic-infrastructure-${options.network}`;

  if (options.createBasicInfrastructure) {
    console.log(`Creating basic infrastructure in ${options.region}...`);

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

    const template = fs.readFileSync(`${__dirname}/../cloudformation/basic-infrastructure.yaml`).toString();

    await stackAction("createStack", cloudFormation, basicInfrastructureStackName, template, basicInfrastructureParams);
  }

  await waitForStacks(cloudFormation, options.region, (stacks: any) => {
    return _.isObject(_.find(stacks, (s: any) => s.StackName === basicInfrastructureStackName && s.StackStatus === "CREATE_COMPLETE"));
  });

  if (options.tagDockerImage) {
    tagDockerImage(options);
  }

  if (options.pushDockerImage) {
    console.log(`Pushing docker image to ${options.region}...`);
    pushDockerImage(options);
  }

  const stackName = `${options.parity ? "ethereum" : "orbs"}-network-${options.network}`;

  if (options.deployNode || options.updateNode || options.updateConfiguration) {
    console.log(`Uploading bootstrap files to ${options.region}...`);
    uploadBootstrap(options);
  }

  if (options.removeNode) {
    console.log(`Removing old node...`);
    await removeStack(cloudFormation, stackName);
  }

  if (options.listResources) {
    const stackDescription: any = await describeStack(cloudFormation, basicInfrastructureStackName);
    const outputs = stackDescription.Stacks[0].Outputs;

    console.log(`Stack ${basicInfrastructureStackName} in ${options.region} exports`);
    console.log(outputs);

    const nodeIpAllocation = _.find(outputs, { OutputKey: "NodeElasticIP" }).OutputValue;
    const ethereumNodeIpAllocation = _.find(outputs, { OutputKey: "EthereumNodeElasticIP" }).OutputValue;
    const [ nodeIp, ethereumNodeIp ] = _.map((<any> await getElasticIp(ec2, [ nodeIpAllocation, ethereumNodeIpAllocation ])).Addresses, "PublicIp");

    console.log(".env configuration");
    console.log(`GOSSIP_PEERS=ws://${nodeIp}:60001`);

    console.log("Local Ethereum configuration (do !not! put into .env file)");
    console.log(`ETHEREUM_NODE_HTTP_ADDRESS=http://${ethereumNodeIp}:8545`);
  }

  if (options.deployNode || options.updateNode) {
    await waitForStacks(cloudFormation, options.region, (stacks: any) => {
      const nodeStack = _.find(stacks, { StackName: stackName });

      // TODO: fix never-ending update loop if node does not exit
      if (options.updateNode && !_.isObject(nodeStack)) {
        throw new Error(`Can't update if stack ${stackName} does not exist!`);
      }

      const check = options.updateNode ? _.isObject : _.isEmpty;
      return check(nodeStack);
    });

    if (options.deployNode) {
      console.log(`Deploying new node to ${options.region}...`);
    }

    if (options.updateNode) {
      console.log(`Updating node in ${options.region}...`);
    }

    const paramsFileName = options.parity ? "parameters.parity.json" : "parameters.node.json";

    const standaloneParams = JSON.parse(fs.readFileSync(`${__dirname}/../cloudformation/${paramsFileName}`).toString());

    setParameter(standaloneParams, "NodeEnv", options.NODE_ENV);
    setParameter(standaloneParams, "KeyName", keyName);
    setParameter(standaloneParams, "DockerTag", options.dockerTag || getDefaultDockerImageTag());

    if (options.EthereumElasticIP) {
      setParameter(standaloneParams, "EthereumElasticIP", options.ethereumNodeIp);
    }

    const sshCidr = (options.sshCidr || "0.0.0.0/0").split(",");
    const peersCidr = (options.peersCidr || "0.0.0.0/0").split(",");

    // TODO: move to Kubernetes, this is getting ridiculous
    _.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;
    const template = _.template(fs.readFileSync(`${__dirname}/../cloudformation/node.yaml`).toString())({
      sshCidr, peersCidr
    });

    const action = options.updateNode ? "updateStack" : "createStack";
    await stackAction(action, cloudFormation, stackName, template, standaloneParams);

    // TODO: fix ssh command if dnsZone is absent
    const hostname = options.parity ? `ethereum.${options.region}.global.services` : `${options.region}.global.nodes`;
    console.log(`ssh -o StrictHostKeyChecking=no ec2-user@${hostname}.${options.NODE_ENV}.${options.dnsZone}`);
  }
}

export function getBaseConfig() {
  const nodeConfig = {
    network: config.get("network"),
    accountId: config.get("account-id"),
    NODE_ENV: config.get("network") == "mainnet" ? "production" : "staging",
    dnsZone: config.get("dns-zone"),
    sshPublicKey: config.get("ssh-public-key"),
    createBasicInfrastructure: config.get("create-basic-infrastructure"),
    bucketName: config.get("s3-bucket-name"),
    pushDockerImage: config.get("push-docker-image"),
    tagDockerImage: config.get("tag-docker-image"),
    dockerTag: config.get("docker-tag"),
    deployNode: config.get("deploy-node"),
    removeNode: config.get("remove-node"),
    updateNode: config.get("update-node"),
    updateConfiguration: config.get("update-configuration"),
    listResources: config.get("list-resources"),
    ethereumNodeIp: config.get("ethereum-node-ip"),
    parity: config.get("parity"),
    sshCidr: config.get("ssh-cidr"),
    peersCidr: config.get("peers-cidr"),
  };

  return nodeConfig;
}

async function main() {
  const nodeConfig = getBaseConfig();
  const regions = config.get("region").split(",");
  const step = config.get("step") || 3;

  const someRegionsList = _.chunk(regions, step);

  for (const someRegions of someRegionsList) {
    try {
      await Promise.all(someRegions.map((region: string) => execute(_.extend({}, nodeConfig, { region }))));
    } catch (e) {
      console.error(e);
    }
  }
}

if (!module.parent) {
  main();
}
