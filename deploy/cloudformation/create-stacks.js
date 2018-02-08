const shell = require('shelljs');
const fs = require('fs');
const stacks = require('./stacks');

const getParameters = () => require('./parameters');

const setParameter = (params, key, value) => {
  params.forEach((param, index) => {
    if (param.ParameterKey === key) {
      params[index].ParameterValue = value;
    }
  });
};

const getStackName = stack => `orbs-network-${stack.name}`;

const deploy = stack =>
  new Promise((resolve, reject) => {
    console.log(`Deploying ${stack.name}`);

    const params = getParameters();

    setParameter(params, 'ElasticIP', stack['eip-allocation']);
    setParameter(params, 'NodeName', stack['name']);

    const paramsPath = `${__dirname}/tmp/parameters-${stack.name}.json`;

    fs.writeFileSync(paramsPath, JSON.stringify(params));

    shell.exec(`aws cloudformation create-stack --region us-west-2 --template-body file://${__dirname}/cloudformation.yaml --parameters "$(cat ${paramsPath})" --stack-name ${getStackName(stack)}`, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });

const remove = stack =>
  new Promise((resolve, reject) => {
    console.log(`Removing ${stack.name}`);

    shell.exec(`aws cloudformation delete-stack --region us-west-2 --stack-name ${getStackName(stack)}`, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });

const removeAll = () => Promise.all(stacks.map(remove));
const deployAll = () => Promise.all(stacks.map(deploy));

if (process.argv[2] === '--remove-all') {
  removeAll().then(console.log, console.error);
} else {
  deployAll().then(console.log, console.error);
}
