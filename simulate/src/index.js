const path = require("path");
const shell = require("shelljs");

function runService(topologyPath) {
  const topology = require(topologyPath);
  const projectPath = path.resolve(__dirname, "../../projects/", topology.project);
  shell.cd(projectPath);
  shell.exec(`node dist/index.js ${topologyPath}`, {async: true});
}

async function main() {
  runService(path.resolve(__dirname, "../../config/topology/node1/service1.json"));
  runService(path.resolve(__dirname, "../../config/topology/node1/service2.json"));
}

main();
