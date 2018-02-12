"use strict";

const _ = require('lodash');
const AWS = require('aws-sdk');
const shell = require('shelljs');
const fs = require('fs');
const stacksConfig = require('./stacks');

const REGION = process.env.AWS_REGION || 'us-west-2';
const cloudFormation = new AWS.CloudFormation({region: REGION});

const getParameters = () => require('./parameters');

const setParameter = (params, key, value) => {
  const param = _.find(params, p => p.ParameterKey === key);
  if (param) {
    param.ParameterValue = value;
  }
};

const getStackName = stack => `orbs-network-${stack.name}`;

const deploy = stack =>
  new Promise((resolve, reject) => {
    console.log(`Deploying ${stack.name}`);

    const params = getParameters();

    setParameter(params, 'ElasticIP', stack['eip-allocation']);
    setParameter(params, 'NodeName', stack['name']);

    const templateBody = fs.readFileSync('./cloudformation.yaml').toString();

    return new Promise((resolve, reject) => {
      cloudFormation.createStack({
        StackName: getStackName(stack),
        Parameters: params,
        TemplateBody: templateBody
      }, (err, data) => {
        err ? reject(err) : resolve(data);
      });      
    });
  });

const remove = stack => {
  return new Promise((resolve, reject) => {
    console.log(`Removing ${stack.StackName}`);
    return cloudFormation.deleteStack({StackName: stack.StackName}, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
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

const getStacks = () => new Promise((resolve, reject) => {
  cloudFormation.listStacks({StackStatusFilter: CF_STACK_STATUS}, (err, data) => {
      if (err) return reject(err);

      const stacks = _.filter(stacksConfig.map(stack => {
        return _.find(data.StackSummaries, summary => _.endsWith(summary.StackName, stack.name))
      }), _.isObject);

      console.log(`Found ${stacks.length} stacks: ${_.map(stacks, 'StackName').join(', ')}`);
      resolve(stacks);
  });
});

const cfStacks = getStacks();

const removeAll = () => cfStacks.then(stacks => {
  console.log('Removing stacks...');
  return Promise.all(_.map(stacks, remove));
});

const waitForCleanup = () => new Promise((resolve, reject) => {
  const interval = setInterval(() => {
    console.log('Waiting for CloudFormation to be empty...');

    getStacks().then(stacks => {
      if (stacks.length === 0) {
        clearInterval(interval);
        resolve();
      }
    }).catch(reject);
  }, 5000);
});

const deployAll = () => {
  return Promise.all(_.map(stacksConfig, deploy));
};

if (process.argv[2] === '--remove-all') {
  removeAll().then(console.log, console.error);
} else {
  removeAll().then(waitForCleanup).then(deployAll).then(console.log, (err) => {
    console.error(console.error);
    process.exit(1);
  });
}
