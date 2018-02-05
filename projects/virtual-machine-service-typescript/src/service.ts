import { logger, ErrorHandler, topology, grpc, topologyPeers, types } from "orbs-common-library";
import * as _ from "lodash";
import bind from "bind-decorator";
import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";

ErrorHandler.setup();

export default class VirtualMachineService {

  peers: types.ClientMap;
  private stateStorage = topologyPeers(topology.peers).stateStorage;
  processor: HardCodedSmartContractProcessor;

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async executeTransaction(rpc: types.ExecuteTransactionContext) {
    logger.debug(`${topology.name}: execute transaction ${JSON.stringify(rpc.req)}`);


    // currently only a "simple" contract type is supported
    try {
      const modifiedKeys = await this.processor.processTransaction({
        sender: rpc.req.sender,
        contractAddress: rpc.req.contractAddress,
        lastBlockId: rpc.req.lastBlockId,
        argumentsJson: rpc.req.argumentsJson
      });
      rpc.res = {
        success: true,
        modifiedAddressesJson: JSON.stringify(_.fromPairs([...modifiedKeys].map(
          ([{contractAddress, key}, value]) => [key, value])))
      };
    } catch (err) {
      logger.error("processTransaction() error: " + err);
      rpc.res = {success: false, modifiedAddressesJson: undefined};
    }
  }

  @bind
  public async callContract(rpc: types.CallContractContext) {
    logger.debug(`${topology.name}: call contract ${JSON.stringify(rpc.req)}`);

    const result = await this.processor.call({
      sender: rpc.req.sender,
      contractAddress: rpc.req.contractAddress,
      argumentsJson: rpc.req.argumentsJson
    });

    rpc.res = {
      resultJson: JSON.stringify(result)
    };
  }

  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.debug(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  async askForHeartbeats() {
    return await Promise.all([
      this.askForHeartbeat(this.peers.publicApi),
      this.askForHeartbeat(this.peers.gossip)
    ]);
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    this.processor = new HardCodedSmartContractProcessor(this.stateStorage);
    // setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    logger.info(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
  }
}
