import { topology, grpc, topologyPeers, types } from "orbs-common-library";
import bind from "bind-decorator";

export default class VirtualMachineService {

  peers: types.ClientMap;

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    console.log(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async executeTransaction(rpc: types.ExecuteTransactionContext) {
    console.log(`${topology.name}: execute transaction ${JSON.stringify(rpc.req)}`);
    rpc.res = { success: Math.random() > 0.1, modifiedAddressesJson: new Map<string, string>() };
  }
  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    console.log(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  async askForHeartbeats() {
    return await Promise.all([
      this.askForHeartbeat(this.peers.publicApi),
      this.askForHeartbeat(this.peers.gossip)
    ]);
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    // setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    console.log(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
  }

}
