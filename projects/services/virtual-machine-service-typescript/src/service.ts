
import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, topologyPeers, grpc, types, topology } from "orbs-core-library";

import { VirtualMachine } from "orbs-core-library";

const nodeTopology = topology();

export default class VirtualMachineService {
  private virtualMachine: VirtualMachine;

  private stateStorage: types.StateStorageClient = topologyPeers(nodeTopology.peers).stateStorage;

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${nodeTopology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: nodeTopology.name, responderVersion: nodeTopology.version };
  }

  @bind
  public async executeTransaction(rpc: types.ExecuteTransactionContext) {
    logger.debug(`${nodeTopology.name}: execute transaction ${JSON.stringify(rpc.req)}`);

    // Currently only a "simple" contract type is supported
    try {
      const modifiedKeys = await this.virtualMachine.executeTransaction(rpc.req);

      rpc.res = {
        success: true,
        modifiedAddressesJson: JSON.stringify(_.fromPairs([...modifiedKeys].map(
          ([{ contractAddress, key }, value]) => [key, value])))
      };

    } catch (err) {
      logger.error("executeTransaction() error: " + err);

      rpc.res = { success: false, modifiedAddressesJson: undefined };
    }
  }

  @bind
  public async callContract(rpc: types.CallContractContext) {
    logger.debug(`${nodeTopology.name}: call contract ${JSON.stringify(rpc.req)}`);

    const result = await this.virtualMachine.callContract(rpc.req);

    rpc.res = {
      resultJson: JSON.stringify(result)
    };
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: nodeTopology.name, requesterVersion: nodeTopology.version });
    logger.debug(`${nodeTopology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    const peers = topologyPeers(nodeTopology.peers);

    this.askForHeartbeat(peers.stateStorage);
  }

  async main() {
    logger.info(`${nodeTopology.name}: service started`);

    this.virtualMachine = new VirtualMachine(this.stateStorage);

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    setTimeout(() => this.main(), 2000);
  }
}
