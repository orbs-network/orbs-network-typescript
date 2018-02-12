import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, topologyPeers, grpc, types } from "orbs-core-library";
import { topology } from "orbs-core-library/src/common-library/topology";

import { Consensus, RaftConsensusConfig } from "orbs-core-library";
import { Gossip } from "orbs-core-library";
import { TransactionPool } from "orbs-core-library";
import { SubscriptionManager } from "orbs-core-library";

export default class ConsensusService {
  private consensus: Consensus;
  private transactionPool: TransactionPool;
  private subscriptionManager: SubscriptionManager;

  private gossip = topologyPeers(topology.peers).gossip;
  private virtualMachine = topologyPeers(topology.peers).virtualMachine;
  private storage = topologyPeers(topology.peers).storage;
  private sidechainConnector = topologyPeers(topology.peers).sidechainConnector;

  // Consensus RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);

    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async sendTransaction(rpc: types.SendTransactionContext) {
    logger.debug(`${topology.name}: sendTransaction ${JSON.stringify(rpc.req)}`);

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
    logger.info(`${topology.name}: addNewPendingTransaction ${JSON.stringify(rpc.req.transaction)}`);

    this.transactionPool.addNewPendingTransaction(rpc.req.transaction);

    rpc.res = {};
  }

  @bind
  public async addExistingPendingTransaction(rpc: types.AddExistingPendingTransactionContext) {
    logger.info(`${topology.name}: addExistingPendingTransaction ${JSON.stringify(rpc.req.transaction)}`);

    this.transactionPool.addExistingPendingTransaction(rpc.req.transaction);

    rpc.res = {};
  }

  // Subscription Manager RPC:

  @bind
  async getSubscriptionStatus(rpc: types.GetSubscriptionStatusContext) {
    const { id, tokens } = await this.subscriptionManager.getSubscriptionStatus(rpc.req.subscriptionKey);
    rpc.res = { active: tokens.isGreaterThan(0), expiryTimestamp: Date.now() + 24 * 60 * 1000};
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.debug(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    const peers = topologyPeers(topology.peers);

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

  async initSubscriptionManager(): Promise<void> {
    const subscriptionManagerConfiguration = { ethereumContractAddress: config.get("ethereumContractAddress") };

    if (!subscriptionManagerConfiguration.ethereumContractAddress) {
      logger.error("ethereumContractAddress wasn't provided! Subscription manager is disabled!");

      return;
    }

    this.subscriptionManager = new SubscriptionManager(this.sidechainConnector, subscriptionManagerConfiguration);
  }

  async main() {
    logger.info(`${topology.name}: service started`);

    await Promise.all([
      this.initConsensus(),
      this.initTransactionPool(),
      this.initSubscriptionManager()
    ]);

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
