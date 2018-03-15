import * as _ from "lodash";
import bind from "bind-decorator";

import { types, logger } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { TransactionPool } from "orbs-core-library";

export default class TransactionPoolService extends Service {
  private transactionPool: TransactionPool;
  private pollInterval: NodeJS.Timer;
  private pollIntervalMs = 2000;

  public constructor(transactionPool: TransactionPool, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.transactionPool = transactionPool;
  }

  async initialize() {
    this.pollInterval = setInterval(() => {
      const { transactions } = this.transactionPool.getAllPendingTransactions();
      const size = transactions.length;

      if (size === 0) {
        logger.debug(`Transaction pool has no pending transactions`);
      } else {
        logger.debug(`Transaction pool has ${size} pending transactions`);
      }
    }, this.pollIntervalMs);
  }

  async shutdown() {
    clearInterval(this.pollInterval);
  }

  @Service.RPCMethod
  public async addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext) {
     await this.transactionPool.addNewPendingTransaction(rpc.req.transaction);
     rpc.res = {};
  }

  @Service.RPCMethod
  public async getAllPendingTransactions(rpc: types.GetAllPendingTransactionsContext) {
    rpc.res = this.transactionPool.getAllPendingTransactions();
  }

  @Service.RPCMethod
  public async clearPendingTransactions(rpc: types.ClearPendingTransactionsContext) {
    this.transactionPool.clearPendingTransactions(rpc.req.transactions);
    rpc.res = {};
  }

  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const obj: any = JSON.parse(rpc.req.buffer.toString("utf8"));
    await this.transactionPool.gossipMessageReceived(rpc.req.fromAddress, rpc.req.messageType, obj);
  }
}
