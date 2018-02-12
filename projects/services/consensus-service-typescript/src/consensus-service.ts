import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, topology, topologyPeers, grpc, types } from "orbs-core-library";

import { Consensus, RaftConsensusConfig } from "orbs-core-library";
import { Gossip } from "orbs-core-library";
import { TransactionPool } from "orbs-core-library";

const nodeTopology = topology();

export default class ConsensusService {
  private consensus: Consensus;
  private transactionPool: TransactionPool;

  private gossip = topologyPeers(nodeTopology.peers).gossip;
  private virtualMachine = topologyPeers(nodeTopology.peers).virtualMachine;
  private storage = topologyPeers(nodeTopology.peers).storage;

  // Consensus RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${nodeTopology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);

    rpc.res = { responderName: nodeTopology.name, responderVersion: nodeTopology.version };
  }

  @bind
  public async sendTransaction(rpc: types.SendTransactionContext) {
    logger.debug(`${nodeTopology.name}: sendTransaction ${JSON.stringify(rpc.req)}`);

    await this.consensus.sendTransaction(rpc.req);

    rpc.res = {};
  }

  @bind
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const obj: any = JSON.parse(rpc.req.Buffer.toString("utf8"));
    this.consensus.gossipMessageReceived(rpc.req.FromAddress, rpc.req.MessageType, obj);
  }

  // Transaction Pool RPC:

  @bind
  public async addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext) {
    logger.info(`${nodeTopology.name}: addNewPendingTransaction ${JSON.stringify(rpc.req.transaction)}`);

    this.transactionPool.addNewPendingTransaction(rpc.req.transaction);

    rpc.res = {};
  }

  @bind
  public async addExistingPendingTransaction(rpc: types.AddExistingPendingTransactionContext) {
    logger.info(`${nodeTopology.name}: addExistingPendingTransaction ${JSON.stringify(rpc.req.transaction)}`);

    this.transactionPool.addExistingPendingTransaction(rpc.req.transaction);

    rpc.res = {};
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: nodeTopology.name, requesterVersion: nodeTopology.version });
    logger.debug(`${nodeTopology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    const peers = topologyPeers(nodeTopology.peers);

    this.askForHeartbeat(peers.virtualMachine);
    this.askForHeartbeat(peers.storage);
  }

  async initConsensus(): Promise<void> {
    // Get the protocol configuration from the environment settings.
    const consensusConfig = config.get("consensus");
    if (!consensusConfig) {
      throw new Error("Couldn't find consensus configuration!");
    }

    this.consensus = new Consensus(consensusConfig, this.gossip, this.virtualMachine, this.storage);
  }

  async initTransactionPool(): Promise<void> {
    this.transactionPool = new TransactionPool();
  }

  async main() {
    logger.info(`${nodeTopology.name}: service started`);

    await Promise.all([
      this.initConsensus(),
      this.initTransactionPool()
    ]);

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
