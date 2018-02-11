import { types, logger } from "../common-library";
import { Block } from "web3/types";

import { EthereumConnector } from "./ethereum-connector";
import { SidechainConnectorClient } from "../../../../architecture/dist/index";

export interface SidechainConnectorOptions {
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

    logger.info(`setting up connector to ethereum node on address ${address}`);

    return EthereumConnector.createHttpConnector(address);
  }

  constructor(options: SidechainConnectorOptions = {}) {
    this.options = options;
    this.ethereumConnector = this.createEthereumConnector();
  }
}
