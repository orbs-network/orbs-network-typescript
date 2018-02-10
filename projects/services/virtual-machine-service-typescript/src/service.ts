
import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, topology, topologyPeers, grpc, types } from "orbs-common-library";

import { VirtualMachine } from "orbs-virtual-machine-library";

export default class VirtualMachineService {
  private virtualMachine: VirtualMachine;

  private storage: types.StorageClient = topologyPeers(topology.peers).storage;

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async executeTransaction(rpc: types.ExecuteTransactionContext) {
    logger.debug(`${topology.name}: execute transaction ${JSON.stringify(rpc.req)}`);

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
    logger.debug(`${topology.name}: call contract ${JSON.stringify(rpc.req)}`);

    const result = await this.virtualMachine.callContract(rpc.req);

    rpc.res = {
      resultJson: JSON.stringify(result)
    };
  }

  async main() {
    logger.info(`${topology.name}: service started`);

    this.virtualMachine = new VirtualMachine(this.storage);
  }

  constructor() {
    setTimeout(() => this.main(), 2000);
  }
}
