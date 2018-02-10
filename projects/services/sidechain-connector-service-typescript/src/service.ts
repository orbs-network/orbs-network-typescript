import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, topology, grpc, types } from "orbs-common-library";

import { SidechainConnector, SidechainConnectorOptions } from "orbs-sidechain-connector-library";

export default class SidechainConnectorService {
  private sidechainConnector: SidechainConnector;

  // Sidechain Connector RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);

    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async callEthereumContract(rpc: types.CallEthereumContractContext) {
    const { result, block } = await this.sidechainConnector.callEthereumContract(rpc.req);

    rpc.res = {
      resultJson: JSON.stringify(result),
      blockNumber: block.number.toString(),
      timestamp: block.timestamp
    };
  }

  async main(options: SidechainConnectorOptions) {
    logger.info(`${topology.name}: service started`);

    this.sidechainConnector = new SidechainConnector(options);
  }

  constructor(options: SidechainConnectorOptions) {
    setTimeout(() => this.main(options), 0);
  }
}
