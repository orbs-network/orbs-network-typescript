import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, grpc, types } from "orbs-core-library";
import { topology } from "orbs-core-library/src/common-library/topology";

import { SidechainConnector, SidechainConnectorOptions } from "orbs-core-library";

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

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.debug(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
  }

  async main(options: SidechainConnectorOptions) {
    logger.info(`${topology.name}: service started`);

    this.sidechainConnector = new SidechainConnector(options);

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor(options: SidechainConnectorOptions) {
    setTimeout(() => this.main(options), 0);
  }
}
