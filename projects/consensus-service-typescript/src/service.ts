import { logger, config, ErrorHandler, topology, grpc, topologyPeers, types } from "orbs-common-library";
import bind from "bind-decorator";
import RaftConsensus from "./raft-consensus";

ErrorHandler.setup();

export default class ConsensusService {
  private consensus: RaftConsensus;

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async sendTransaction(rpc: types.SendTransactionContext) {
    logger.debug(`${topology.name}: sendTransaction ${JSON.stringify(rpc.req)}`);

    await this.consensus.onAppend(rpc.req.transaction, rpc.req.transactionAppendix);

    rpc.res = {};
  }

  @bind
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    logger.debug(`${topology.name}: gossipMessageReceived ${JSON.stringify(rpc.req)}`);
    const obj: any = JSON.parse(rpc.req.Buffer.toString("utf8"));
    this.consensus.gossipMessageReceived(rpc.req.FromAddress, rpc.req.MessageType, obj);
  }

  constructor() {
    logger.info(`${topology.name}: service started`);

    // Get the protocol configuration from the environment settings.
    const consensusConfig = config.get("consensus");
    if (!consensusConfig) {
      throw new Error("Couldn't find consensus configuration!");
    }

    this.consensus = new RaftConsensus(consensusConfig);
  }
}
