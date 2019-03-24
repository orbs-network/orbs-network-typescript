/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { logger, types, StartupCheck } from "orbs-core-library";
import { StartupStatus } from "orbs-core-library";

import { Service } from "orbs-core-library";
import { SidechainConnector, SidechainConnectorOptions } from "orbs-core-library";

export default class SidechainConnectorService extends Service implements StartupCheck {
  private options: SidechainConnectorOptions;
  private sidechainConnector: SidechainConnector;

  public constructor(options: SidechainConnectorOptions) {
    super(options);

    this.options = options;
  }

  async initialize() {
    this.sidechainConnector = new SidechainConnector(this.options);
  }

  async shutdown() {

  }

  @Service.RPCMethod
  public async callEthereumContract(rpc: types.CallEthereumContractContext) {
    const { result, block } = await this.sidechainConnector.callEthereumContract(rpc.req);

    rpc.res = {
      resultJson: JSON.stringify(result),
      blockNumber: block.number.toString(),
      timestamp: block.timestamp
    };
  }

  public async startupCheck(): Promise<StartupStatus> {
    return this.sidechainConnector.startupCheck();
  }

}
