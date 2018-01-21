import { logger, topology, topologyPeers, types, CryptoUtils } from "orbs-common-library";
import bind from "bind-decorator";

export default class PublicApiService {

  peers: types.ClientMap;

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.info(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.info(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    // this.askForHeartbeat(this.peers.transactionPool);
    this.askForHeartbeat(this.peers.gossip);
  }

  @bind
  async sendTransaction(rpc: types.SendTransactionContext) {
    console.log(`${topology.name}: send transaction ${JSON.stringify(rpc.req)}`);

    await this.peers.consensus.sendTransaction(rpc.req);
  }

  @bind
  async call(rpc: types.CallContext) {
    const {resultJson} = await this.peers.virtualMachine.callContract({
      sender: rpc.req.sender,
      argumentsJson: rpc.req.argumentsJson,
      contractAddress: rpc.req.contractAddress
    });

    console.log(`${topology.name}: called contract with ${JSON.stringify(rpc.req)}. result is: ${resultJson}`);

    rpc.res = {
      resultJson: resultJson
    };
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    logger.info(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
    process.on("uncaughtException", (err: Error) => {
      console.error(`${__filename}: Caught exception: ${err}`);
      console.error(err.stack);
    });
    process.on("unhandledRejection", (err: Error) => {
      console.error(`${__filename}: Unhandled rejection: ${err}`);
      console.error(err.stack);
    });

  }

}
