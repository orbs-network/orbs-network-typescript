/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { types, JsonBuffer, StartupCheck, StartupStatus, STARTUP_STATUS } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { Consensus } from "orbs-core-library";

export default class ConsensusService extends Service implements StartupCheck {
  private SERVICE_NAME = "consensus";
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

  public async startupCheck(): Promise<StartupStatus> {
    if (!this.consensus) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Missing consensus" };
    }
    return this.consensus.startupCheck();
  }

}
