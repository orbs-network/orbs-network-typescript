import * as _ from "lodash";

import { types, JsonBuffer } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { Consensus } from "orbs-core-library";

export default class ConsensusService extends Service {
  private consensus: Consensus;

  public constructor(consensus: Consensus, serviceConfig: ServiceConfig) {
    super(serviceConfig);

    this.consensus = consensus;
  }

  async initialize() {
    return this.consensus.initialize();
  }

  async shutdown() {
    return this.consensus.shutdown();
  }


  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const payload: any = JsonBuffer.parseJsonWithBuffers(rpc.req.buffer.toString("utf8"));
    this.consensus.gossipMessageReceived(rpc.req.fromAddress, rpc.req.messageType, payload);
  }
}
