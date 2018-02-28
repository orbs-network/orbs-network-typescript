import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service } from "orbs-core-library";
import { SidechainConnector, SidechainConnectorOptions } from "orbs-core-library";

export default class SidechainConnectorService extends Service {
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
}
