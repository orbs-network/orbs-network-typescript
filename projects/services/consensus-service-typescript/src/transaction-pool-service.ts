import * as _ from "lodash";
import bind from "bind-decorator";

import { types, logger, JsonBuffer } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { TransactionPool } from "orbs-core-library";

export default class TransactionPoolService extends Service {
  private transactionPool: TransactionPool;

  public constructor(transactionPool: TransactionPool, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.transactionPool = transactionPool;
  }

  async initialize() {
  }

  async shutdown() {

  }

  @Service.RPCMethod
  public async addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext) {
     await this.transactionPool.addNewPendingTransaction(rpc.req.transaction);
     rpc.res = {};
  }

  @Service.RPCMethod
  public async getAllPendingTransactions(rpc: types.GetAllPendingTransactionsContext) {
    rpc.res = this.transactionPool.getAllPendingTransactions();
    logger.debug(`getAllPendingTransactions() . returns ${JSON.stringify(rpc.res)}`);
  }

  @Service.RPCMethod
  public async clearPendingTransactions(rpc: types.ClearPendingTransactionsContext) {
    this.transactionPool.clearPendingTransactions(rpc.req.transactions);
    rpc.res = {};
  }

  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const obj: any = JsonBuffer.parseJsonWithBuffers(rpc.req.buffer.toString("utf8"));
    await this.transactionPool.gossipMessageReceived(rpc.req.fromAddress, rpc.req.messageType, obj);
  }
}
