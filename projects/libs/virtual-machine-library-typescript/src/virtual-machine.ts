import * as _ from "lodash";

import { logger, topology, topologyPeers, types } from "orbs-common-library";

import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";

export class VirtualMachine {
  private processor: HardCodedSmartContractProcessor;

  public constructor() {
    this.processor = new HardCodedSmartContractProcessor(topologyPeers(topology.peers).storage);
  }

  public async executeTransaction(sender: string, contractAddress: string, payload: string) {
    // Currently only a "simple" contract type is supported
    try {
      const modifiedKeys = await this.processor.processTransaction({
        sender: sender,
        contractAddress: contractAddress,
        payload: payload
      });

      return {
        success: true,
        modifiedAddressesJson: JSON.stringify(_.fromPairs([...modifiedKeys].map(
          ([{ contractAddress, key }, value]) => [key, value])))
      };
    } catch (err) {
      logger.error("processTransaction() error: " + err);
      return { success: false, modifiedAddressesJson: undefined };
    }
  }

  public async callContract(sender: string, contractAddress: string, payload: string) {
    return await this.processor.call({
      sender: sender,
      contractAddress: contractAddress,
      payload: payload
    });
  }
}
