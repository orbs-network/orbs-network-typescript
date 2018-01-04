import { logger, topology, grpc, topologyPeers, types } from "orbs-common-library";
import bind from "bind-decorator";

export default class TransactionPoolService {

  peers: types.ClientMap;
  pendingTransactions = new Map<string, types.Transaction>();

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.info(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext) {
    logger.info(`${topology.name}: addNewPendingTransaction ${JSON.stringify(rpc.req.transaction)}`);
    // if (!this.pendingTransactions.has(rpc.req.transaction.id)) {
    //   this.pendingTransactions.set(rpc.req.transaction.id, rpc.req.transaction);
    //   logger.info(`${topology.name}: after adding we have ${this.pendingTransactions.size} pending transactions`);
    // }
    // For example:
    // await this.peers.gossip.announceTransaction({ transaction: rpc.req.transaction });
    rpc.res = {};
  }

  @bind
  public async addExistingPendingTransaction(rpc: types.AddExistingPendingTransactionContext) {
    // logger.info(`${topology.name}: addExistingPendingTransaction ${JSON.stringify(rpc.req.transaction)}`);
    // if (!this.pendingTransactions.has(rpc.req.transaction.id)) {
    //   this.pendingTransactions.set(rpc.req.transaction.id, rpc.req.transaction);
    //   logger.info(`${topology.name}: after adding we have ${this.pendingTransactions.size} pending transactions`);
    // }
    rpc.res = {};
  }

  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.info(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    this.askForHeartbeat(this.peers.publicApi);
    this.askForHeartbeat(this.peers.gossip);
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    logger.info(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
  }

}
