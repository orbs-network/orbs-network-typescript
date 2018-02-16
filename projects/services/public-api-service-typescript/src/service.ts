import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, topology, topologyPeers, grpc, types } from "orbs-core-library";

import { TransactionHandler, TransactionHandlerConfig } from "orbs-core-library";
import { PublicApi } from "orbs-core-library";

const nodeTopology = topology();

class ConstantTransactionHandlerConfig implements TransactionHandlerConfig {
  validateSubscription(): boolean {
    return true;
  }
}

export default class PublicApiService {
  private publicApi: PublicApi;

  private virtualMachine = topologyPeers(nodeTopology.peers).virtualMachine;
  private consensus = topologyPeers(nodeTopology.peers).consensus;
  private subscriptionManager = topologyPeers(nodeTopology.peers).subscriptionManager;
  private transactionHandler = new TransactionHandler(this.consensus, this.subscriptionManager,
    new ConstantTransactionHandlerConfig());

  // Public API RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${nodeTopology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: nodeTopology.name, responderVersion: nodeTopology.version };
  }

    @bind
    async sendTransaction(rpc: types.SendTransactionContext) {
      logger.debug(`${nodeTopology.name}: send transaction ${JSON.stringify(rpc.req)}`);

      await this.publicApi.sendTransaction(rpc.req);
    }

  @bind
  async call(rpc: types.CallContext) {
    const resultJson = await this.publicApi.callContract(rpc.req);

    logger.debug(`${nodeTopology.name}: called contract with ${JSON.stringify(rpc.req)}. result is: ${resultJson}`);

    rpc.res = {
      resultJson: resultJson
    };
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: nodeTopology.name, requesterVersion: nodeTopology.version });
    logger.debug(`${nodeTopology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    const peers = topologyPeers(nodeTopology.peers);

    this.askForHeartbeat(peers.consensus);
    this.askForHeartbeat(peers.virtualMachine);
  }

  async main() {
    logger.info(`${nodeTopology.name}: service started`);

    this.publicApi = new PublicApi(this.transactionHandler, this.virtualMachine);

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
