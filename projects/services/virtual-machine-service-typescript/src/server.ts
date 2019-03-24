/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */


import { grpcServer, topologyPeers, logger, VirtualMachine, StartupCheckRunner } from "orbs-core-library";
import VirtualMachineService from "./service";


function parseContractList(smartContractsToLoad: string) {
  try {
    return JSON.parse(smartContractsToLoad);
  } catch (err) {
    logger.error(`Bad contract list from env: ${smartContractsToLoad} of type ${typeof smartContractsToLoad}. Defaulting to empty list of contracts.`);
    return [];
  }
}

export default function (nodeTopology: any, env: any) {
  const { NODE_NAME, SMART_CONTRACTS_TO_LOAD } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  const peers = topologyPeers(nodeTopology.peers);
  const nodeConfig = { nodeName: NODE_NAME };

  const contractRegistryConfig = {
    contracts: parseContractList(SMART_CONTRACTS_TO_LOAD)
  };

  const virtualMachine = new VirtualMachine(contractRegistryConfig, peers.stateStorage);
  const virtualMachineService = new VirtualMachineService(virtualMachine, nodeConfig);
  const startupCheckRunner = new StartupCheckRunner("virtual-machine-service", [virtualMachineService]);
  return grpcServer.builder()
    .withService("VirtualMachine", virtualMachineService)
    .withStartupCheckRunner(startupCheckRunner)
    .withManagementPort(8081);

}
