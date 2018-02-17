import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, topology, topologyPeers, grpc, types } from "orbs-core-library";

import { Service } from "orbs-core-library";
import { TransactionPool } from "orbs-core-library";

const nodeTopology = topology();

export default class TransactionPoolService extends Service {
  private transactionPool: TransactionPool;

  @Service.RPCMethod
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${nodeTopology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);

    rpc.res = { responderName: nodeTopology.name, responderVersion: nodeTopology.version };
  }

  @Service.RPCMethod
  public async addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext) {
    logger.info(`${nodeTopology.name}: addNewPendingTransaction ${JSON.stringify(rpc.req.transaction)}`);

    this.transactionPool.addNewPendingTransaction(rpc.req.transaction);

    rpc.res = {};
  }

  @Service.RPCMethod
  public async addExistingPendingTransaction(rpc: types.AddExistingPendingTransactionContext) {
    logger.info(`${nodeTopology.name}: addExistingPendingTransaction ${JSON.stringify(rpc.req.transaction)}`);

    this.transactionPool.addExistingPendingTransaction(rpc.req.transaction);

    rpc.res = {};
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: nodeTopology.name, requesterVersion: nodeTopology.version });
    logger.debug(`${nodeTopology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
  }

  async initTransactionPool(): Promise<void> {
    this.transactionPool = new TransactionPool();
  }

  async main() {
    logger.info(`${nodeTopology.name}: service started`);

    await this.initTransactionPool();

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    super();

    setTimeout(() => this.main(), 0);
  }
}
