import * as _ from "lodash";

import { types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { Consensus } from "orbs-core-library";

export default class ConsensusService extends Service {
  private consensus: Consensus;

  public constructor(consensus: Consensus, serviceConfig: ServiceConfig) {
    super(serviceConfig);

    this.consensus = consensus;
  }

  async initialize() {
  }

  async shutdown() {

  }

  @Service.RPCMethod
  public async sendTransaction(rpc: types.SendTransactionContext) {
    await this.consensus.sendTransaction(rpc.req);

    rpc.res = {};
  }

  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const payload: any = JSON.parse(rpc.req.buffer.toString("utf8"));
    this.consensus.gossipMessageReceived(rpc.req.fromAddress, rpc.req.messageType, payload);
  }
}
