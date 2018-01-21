import { topology, topologyPeers, types } from "orbs-common-library";
import bind from "bind-decorator";
import EthereumConnector from "./ethereum-connector";

export default class SidechainConnectorService {

  peers: types.ClientMap;
  ethereumConnector: EthereumConnector;

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    console.log(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    console.log(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
  }



  @bind
  public async callEthereumContract(rpc: types.CallEthereumContractContext) {
      const {result, block} = await this.ethereumConnector.call(rpc.req.contractAddress, rpc.req.functionInterface, rpc.req.parameters);
      rpc.res = {
          resultJson: JSON.stringify(result), blockNumber: block.number.toString(),
          timestamp: block.timestamp
      };
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    this.ethereumConnector = EthereumConnector.createHttpConnector("http://localhost:8545"); // TODO: should not be hard-coded
    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    console.log(`${topology.name}: service started`);
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
