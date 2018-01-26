import { ErrorHandler, topology, topologyPeers, types, logger } from "orbs-common-library";
import bind from "bind-decorator";
import EthereumConnector from "./ethereum-connector";
import { SidechainConnectorClient } from "../../architecture/dist/index";

ErrorHandler.setup();

export interface SidechainConnectorServiceOptions {
  ethereumNodeHttpAddress?: string;
}

export default class SidechainConnectorService {

  peers: types.ClientMap;
  ethereumConnector: EthereumConnector;
  options: SidechainConnectorServiceOptions;

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
  }



  @bind
  public async callEthereumContract(rpc: types.CallEthereumContractContext) {
      const {result, block} = await this.ethereumConnector.call(rpc.req.contractAddress, rpc.req.functionInterface, rpc.req.parameters);
      rpc.res = {
          resultJson: JSON.stringify(result), blockNumber: block.number.toString(),
          timestamp: block.timestamp
      };
  }

  private createEthereumConnector(): EthereumConnector {
    const address = this.options.ethereumNodeHttpAddress || "http://localhost:8545";
    logger.info(`setting up connector to ethereum node on address ${address}`);
    return EthereumConnector.createHttpConnector(address);
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    this.ethereumConnector = this.createEthereumConnector();
    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor(options: SidechainConnectorServiceOptions = {}) {
    this.options = options;
    logger.info(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
    process.on("uncaughtException", (err: Error) => {
      logger.error(`${__filename}: Caught exception: ${err}`);
      logger.error(err.stack);
    });
    process.on("unhandledRejection", (err: Error) => {
      logger.error(`${__filename}: Unhandled rejection: ${err}`);
      logger.error(err.stack);
    });

  }

}
