import * as _ from "lodash";

import { logger, config, types } from "orbs-core-library";

import { Service } from "orbs-core-library";
import { Consensus, RaftConsensusConfig } from "orbs-core-library";
import { Gossip } from "orbs-core-library";
import { TransactionPool } from "orbs-core-library";

export default class ConsensusService extends Service {
  private consensus: Consensus;
  private transactionPool: TransactionPool;

  private gossip: types.GossipClient;
  private virtualMachine: types.VirtualMachineClient;
  private blockStorage: types.BlockStorageClient;

  async initialize() {
    this.gossip = this.peers.gossip;
    this.virtualMachine = this.peers.virtualMachine;
    this.blockStorage = this.peers.blockStorage;

    await Promise.all([
      this.initConsensus(),
      this.initTransactionPool()
    ]);

    this.askForHeartbeats([this.virtualMachine, this.blockStorage]);
  }

  async initConsensus(): Promise<void> {
    // Get the protocol configuration from the environment settings.
    const consensusConfig = config.get("consensus");
    if (!consensusConfig) {
      throw new Error("Couldn't find consensus configuration!");
    }

    this.consensus = new Consensus(consensusConfig, this.gossip, this.virtualMachine, this.blockStorage);
  }

  async initTransactionPool(): Promise<void> {
    this.transactionPool = new TransactionPool();
  }

  @Service.RPCMethod
  public async sendTransaction(rpc: types.SendTransactionContext) {
    await this.consensus.sendTransaction(rpc.req);

    rpc.res = {};
  }

  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const obj: any = JSON.parse(rpc.req.Buffer.toString("utf8"));
    this.consensus.gossipMessageReceived(rpc.req.FromAddress, rpc.req.MessageType, obj);
  }
}
