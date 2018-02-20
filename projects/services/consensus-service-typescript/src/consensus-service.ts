import * as _ from "lodash";

import { logger, config, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { Consensus } from "orbs-core-library";
import { Gossip } from "orbs-core-library";
import { TransactionPool } from "orbs-core-library";

export default class ConsensusService extends Service {
  private consensus: Consensus;
  private transactionPool: TransactionPool;

  public constructor(consensus: Consensus,
                    serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.consensus = consensus;

  }

  async initialize() {
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
