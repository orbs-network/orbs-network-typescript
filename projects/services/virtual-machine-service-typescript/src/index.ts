import * as path from "path";

import { logger, ErrorHandler, grpc, Service, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import VirtualMachineService from "./service";
import { VirtualMachine } from "orbs-core-library";

const { NODE_NAME, SMART_CONTRACTS_TO_LOAD } = process.env;

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/virtual-machine.log"));

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

function parseContractList() {
  try {
    return JSON.parse(SMART_CONTRACTS_TO_LOAD);
  } catch (err) {
    logger.error(`Bad contract list from env: ${SMART_CONTRACTS_TO_LOAD} of type ${typeof SMART_CONTRACTS_TO_LOAD}. Defaulting to empty list of contracts.`);
    return [];
  }
}

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: NODE_NAME};

const contractRegistryConfig = {
  contracts: parseContractList()
};

const virtualMachine = new VirtualMachine(contractRegistryConfig, peers.stateStorage);

ServiceRunner.run(grpc.virtualMachineServer, new VirtualMachineService(virtualMachine, nodeConfig), nodeTopology.endpoint);
