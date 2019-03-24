/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { Block } from "web3/types";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { EthereumConnector } from "./ethereum-connector";
import { SidechainConnectorClient } from "orbs-interfaces";
import { ServiceConfig } from "..";
import { STARTUP_STATUS, StartupStatus } from "../common-library/startup-status";
import { StartupCheck } from "../common-library/startup-check";


export interface SidechainConnectorOptions extends ServiceConfig {
  ethereumNodeHttpAddress?: string;
}

export class SidechainConnector implements StartupCheck {
  public readonly SERVICE_NAME = "sidechain-connector";
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

  public async startupCheck(): Promise<StartupStatus> {
    return { name: this.SERVICE_NAME, status: this.ethereumConnector ? STARTUP_STATUS.OK : STARTUP_STATUS.FAIL };
  }
}
