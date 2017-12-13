import { topology, grpc, types } from "orbs-common-library";
import bind from "bind-decorator";

export default class ChatterService {

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    console.log(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  // service logic

  async tick() {
    for (const peer of topology.peers) {
      const client = grpc.chatterClient({ endpoint: peer.endpoint });
      const res = await client.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
      console.log(`${topology.name}: received heartbeat from peer ${peer.endpoint} who is '${res.responderName}(v${res.responderVersion})'`);
    }
  }

  constructor() {
    console.log(`${topology.name}: service started`);
    setInterval(() => this.tick(), 2000);
  }

}
