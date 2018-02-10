import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, topology, grpc, types } from "orbs-common-library";

import { Consensus, RaftConsensusConfig } from "orbs-consensus-library";
import { Gossip } from "orbs-gossip-library";
import { TransactionPool } from "orbs-transaction-pool-library";
import { SubscriptionManager } from "orbs-subscription-manager-library";

export default class ConsensusService {
  private gossip: Gossip;
  private consensus: Consensus;
  private transactionPool: TransactionPool;
  private subscriptionManager: SubscriptionManager;

  // Consensus RPC:

  @bind
  public async sendTransaction(rpc: types.SendTransactionContext) {
    logger.debug(`${topology.name}: sendTransaction ${JSON.stringify(rpc.req)}`);

    await this.consensus.sendTransaction(rpc.req);

    rpc.res = {};
  }

  // Gossip RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);

    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const obj: any = JSON.parse(rpc.req.Buffer.toString("utf8"));
    this.consensus.gossipMessageReceived(rpc.req.FromAddress, rpc.req.MessageType, obj);
  }

  @bind
  public async broadcastMessage(rpc: types.BroadcastMessageContext) {
    this.gossip.broadcastMessage(rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);

    rpc.res = {};
  }

  @bind
  public async unicastMessage(rpc: types.UnicastMessageContext) {
    this.gossip.unicastMessage(rpc.req.Recipient, rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);

    rpc.res = {};
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

  async initGossip(): Promise<void> {
    this.gossip = new Gossip(topology.gossipPort, config.get("NODE_NAME"), config.get("NODE_IP"));

    setInterval(() => {
      const activePeers = Array.from(this.gossip.activePeers()).sort();

      if (activePeers.length === 0) {
        logger.info(`${this.gossip.localAddress} has no active peers`);
      } else {
        logger.info(`${this.gossip.localAddress} has active peers`, {activePeers});
      }
    }, 5000);

    setTimeout(() => {
      this.gossip.discoverPeers().then((gossipPeers: string[]) => {
        logger.info(`Found gossip peers`, { peers: gossipPeers });

        this.gossip.connect(gossipPeers);
      }).catch(logger.error);
    }, Math.ceil(Math.random() * 3000));
  }

  async initConsensus(): Promise<void> {
    // Get the protocol configuration from the environment settings.
    const consensusConfig = config.get("consensus");
    if (!consensusConfig) {
      throw new Error("Couldn't find consensus configuration!");
    }

    await this.initGossip();

    this.consensus = new Consensus(consensusConfig, this.gossip);
  }

  async initTransactionPool(): Promise<void> {
    this.transactionPool = new TransactionPool();
  }

  async initSubscriptionManager(): Promise<void> {
    this.subscriptionManager = new SubscriptionManager({
      ethereumContractAddress: config.get("ethereumContractAddress")
    });
  }

  async main() {
    logger.info(`${topology.name}: service started`);

    await Promise.all([
      this.initConsensus(),
      this.initTransactionPool(),
      this.initSubscriptionManager()
    ]);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
