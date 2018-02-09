import * as _ from "lodash";

import { logger, topology, topologyPeers, types } from "orbs-common-library";

import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";
import { StateCache, StateCacheKey } from "./state-cache";

export class VirtualMachine {
  private processor: HardCodedSmartContractProcessor;

  public constructor() {
    this.processor = new HardCodedSmartContractProcessor(topologyPeers(topology.peers).storage);
  }

  public async executeTransaction(sender: string, contractAddress: string, payload: string) {
    return await this.processor.processTransaction({
      sender: sender,
      contractAddress: contractAddress,
      payload: payload
    });
  }

  public async callContract(sender: string, contractAddress: string, payload: string) {
    return await this.processor.call({
      sender: sender,
      contractAddress: contractAddress,
      payload: payload
    });
  }
}
