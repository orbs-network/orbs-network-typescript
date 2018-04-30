import { Block } from "web3/types";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { EthereumConnector } from "./ethereum-connector";
import { SidechainConnectorClient } from "orbs-interfaces";
import { ServiceConfig } from "..";

export interface SidechainConnectorOptions extends ServiceConfig {
  ethereumNodeHttpAddress?: string;
}

export class SidechainConnector {
  private ethereumConnector: EthereumConnector;
  private options: SidechainConnectorOptions;

  public static readonly DEFAULT_ETHEREUM_NODE_HTTP_ADDRESS = "http://localhost:8545";

  public async callEthereumContract(input: types.CallEthereumContractInput) {
    return await this.ethereumConnector.call(input.contractAddress, input.functionInterface, input.parameters);
  }

  private createEthereumConnector(): EthereumConnector {
    const address = this.options.ethereumNodeHttpAddress || SidechainConnector.DEFAULT_ETHEREUM_NODE_HTTP_ADDRESS;

    logger.info(`Setting up connector to ethereum node on address ${address}`);

    return EthereumConnector.createHttpConnector(address);
  }

  constructor(options: SidechainConnectorOptions = { nodeName: "unnamed" }) {
    this.options = options;
    this.ethereumConnector = this.createEthereumConnector();
  }
}
