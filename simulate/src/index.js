const path = require("path");
const shell = require("shelljs");

function getTopologies() {
  const topologiesPath = path.resolve(__dirname, "../../config/topologies");
  const res = [];
  shell.ls(topologiesPath).forEach(function (topology) {
    res.push(topology);
  });
  return res;
}

function getNodes(topologyName) {
  const nodesPath = path.resolve(__dirname, "../../config/topologies", topologyName);
  const res = [];
  shell.ls(nodesPath).forEach(function (node) {
    res.push(node);
  });
  return res;
}

function getServices(topologyName, nodeName) {
  const servicesPath = path.resolve(__dirname, "../../config/topologies", topologyName, nodeName);
  const res = [];
  shell.ls(servicesPath).forEach(function (service) {
    res.push(service);
  });
  return res;
}

function getServiceTopologyConfigPath(topologyName, nodeName, serviceName) {
  return path.resolve(__dirname, "../../config/topologies", topologyName, nodeName, serviceName);
}

function showUsage() {
  console.log(`Usage: simulate <topology-name>`);
  console.log(`Available topologies: ${getTopologies()}`);
  console.log();
}

function runService(topologyPath) {
  const topology = require(topologyPath);
  const projectPath = path.resolve(__dirname, "../../projects/", topology.project);
  shell.cd(projectPath);
  shell.exec(`node dist/index.js ${topologyPath}`, {async: true});
}

function runTopology(topologyName) {
  for (const nodeName of getNodes(topologyName)) {
    for (const serviceName of getServices(topologyName, nodeName)) {
      const configPath = getServiceTopologyConfigPath(topologyName, nodeName, serviceName);
      runService(configPath);
    }
  }
}

if (!process.argv[2]) {
  console.log(`ERROR: topology not provided, exiting`);
  showUsage();
  process.exit();
}

const topologyName = process.argv[2];
if (getTopologies().indexOf(topologyName) === -1) {
  console.log(`ERROR: topology with name '${topologyName}' not found, exiting`);
  showUsage();
  process.exit();
}

runTopology(topologyName);
