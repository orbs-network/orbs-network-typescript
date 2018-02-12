import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, topologyPeers, grpc, types } from "orbs-core-library";
import { topology } from "orbs-core-library/src/common-library/topology";

import { PublicApi } from "orbs-core-library";

export default class PublicApiService {
  private publicApi: PublicApi;

  private virtualMachine = topologyPeers(topology.peers).virtualMachine;
  private consensus = topologyPeers(topology.peers).consensus;

  // Public API RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

    @bind
    async sendTransaction(rpc: types.SendTransactionContext) {
      logger.debug(`${topology.name}: send transaction ${JSON.stringify(rpc.req)}`);

      await this.publicApi.sendTransaction(rpc.req);
    }

  @bind
  async call(rpc: types.CallContext) {
    const resultJson = await this.publicApi.callContract(rpc.req);

    logger.debug(`${topology.name}: called contract with ${JSON.stringify(rpc.req)}. result is: ${resultJson}`);

    rpc.res = {
      resultJson: resultJson
    };
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.debug(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    const peers = topologyPeers(topology.peers);

    this.askForHeartbeat(peers.consensus);
    this.askForHeartbeat(peers.virtualMachine);
  }

  async main() {
    logger.info(`${topology.name}: service started`);

    this.publicApi = new PublicApi(this.consensus, this.virtualMachine);

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
