const shell = require("shelljs"),
    fs = require("fs"),
    stacks = require("./stacks");


const getParameters = () => require("./parameters");

const setParameter = (params, key, value) => {
    params.map((parameter) => {
        if (parameter.ParameterKey === key) {
            parameter.ParameterValue = value;
        }
    });
};

const getStackName = (stack) => `orbs-network-${stack.name}`;

const deploy = (stack) => {
    return new Promise((resolve, reject) => {
        console.log(`Deploying ${stack.name}`);

        const params = getParameters();

        setParameter(params, "ElasticIP", stack["eip-allocation"]);
        setParameter(params, "NodeName", stack["name"]);

        const paramsPath = `${__dirname}/tmp/parameters-${stack.name}.json`;

        fs.writeFileSync(paramsPath, JSON.stringify(params));

        shell.exec(`aws cloudformation create-stack --template-body file://${__dirname}/cloudformation.yaml --parameters "$(cat ${paramsPath})" --stack-name ${getStackName(stack)}`, (err, response) => {
            err ? resolve(err) : resolve(response);
        });
    });
};

const remove = (stack) => {
    return new Promise((resolve, reject) => {
        console.log(`Removing ${stack.name}`);

        shell.exec(`aws cloudformation delete-stack --stack-name ${getStackName(stack)}`, (err, response) => {
            err ? resolve(err) : resolve(response);
        });
    });
};

const removeAll = () => {
    return Promise.all(stacks.map(remove));
}

const deployAll = () => {
    return Promise.all(stacks.map(deploy));
}

if (process.argv[2] === '--remove-all') {
    removeAll().then(console.log, console.error);
} else {
    deployAll().then(console.log, console.error);
}
