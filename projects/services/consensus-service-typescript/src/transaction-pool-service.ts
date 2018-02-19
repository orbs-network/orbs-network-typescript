import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, types } from "orbs-core-library";

import { Service } from "orbs-core-library";
import { TransactionPool } from "orbs-core-library";

export default class TransactionPoolService extends Service {
  private transactionPool: TransactionPool;

  public constructor() {
    super();
  }

  async initialize() {
    await this.initTransactionPool();
  }

  async initTransactionPool(): Promise<void> {
    this.transactionPool = new TransactionPool();
  }

  @Service.RPCMethod
  public async addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext) {
    this.transactionPool.addNewPendingTransaction(rpc.req.transaction);

    rpc.res = {};
  }

  @Service.RPCMethod
  public async addExistingPendingTransaction(rpc: types.AddExistingPendingTransactionContext) {
    this.transactionPool.addExistingPendingTransaction(rpc.req.transaction);

    rpc.res = {};
  }
}
