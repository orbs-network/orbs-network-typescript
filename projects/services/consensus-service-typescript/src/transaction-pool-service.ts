import bind from "bind-decorator";

import { types, logger, JsonBuffer } from "orbs-core-library";

import { Service, ServiceConfig, TransactionHelper } from "orbs-core-library";
import { PendingTransactionPool, CommittedTransactionPool } from "orbs-core-library";
import { TransactionStatus } from "orbs-interfaces";

export default class TransactionPoolService extends Service {
  private pendingTransactionPool: PendingTransactionPool;
  private committedTransactionPool: CommittedTransactionPool;
  private monitorPollTimer: NodeJS.Timer;
  private monitorPollIntervalMs = 2000;

  public constructor(pendingTransactionPool: PendingTransactionPool, commitedTransactionPool: CommittedTransactionPool, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.pendingTransactionPool = pendingTransactionPool;
    this.committedTransactionPool = commitedTransactionPool;
  }

  async initialize() {
    this.startPoolSizeMonitor();
    this.pendingTransactionPool.startCleanupTimer();
    this.committedTransactionPool.startCleanupTimer();
  }

  async shutdown() {
    this.committedTransactionPool.stopCleanupTimer();
    this.pendingTransactionPool.stopCleanupTimer();
    this.stopPoolSizeMonitor();
  }

  private startPoolSizeMonitor() {
    this.monitorPollTimer = setInterval(() => {
      const queueSize = this.pendingTransactionPool.getQueueSize();

      if (queueSize === 0) {
        logger.debug(`Transaction pool has no pending transactions`);
      } else {
        logger.debug(`Transaction pool has ${queueSize} pending transactions`);
      }
    }, this.monitorPollIntervalMs);
  }

  private stopPoolSizeMonitor() {
    if (this.monitorPollTimer) {
      clearInterval(this.monitorPollTimer);
    }
  }

  @Service.RPCMethod
  public async markCommittedTransactions(rpc: types.MarkCommittedTransactionsContext) {
    await this.committedTransactionPool.addCommittedTransactions(rpc.req.transactionReceipts);
    await this.pendingTransactionPool.clearCommittedTransactionsFromPendingPool(rpc.req.transactionReceipts);
    rpc.res = {};
  }

  @Service.RPCMethod
  public async addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext) {
     const res = await this.pendingTransactionPool.addNewPendingTransaction(rpc.req.transaction);
     rpc.res = { txid: res };
  }

  @Service.RPCMethod
  public async getAllPendingTransactions(rpc: types.GetAllPendingTransactionsContext) {
    const transactionEntries = this.pendingTransactionPool.getAllPendingTransactions();
    rpc.res = { transactionEntries };
    logger.debug(`getAllPendingTransactions() . returns ${JSON.stringify(rpc.res)}`);
  }

  @Service.RPCMethod
  public async getTransactionStatus(rpc: types.GetTransactionStatusContext) {
    const txid = rpc.req.txid;
    rpc.res = this.pendingTransactionPool.getTransactionStatus(txid);
    if (rpc.res && rpc.res.status == TransactionStatus.NOT_FOUND) {
      rpc.res = this.committedTransactionPool.getTransactionStatus(txid);
    }
  }

  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    if (rpc.req.messageType === "newTransaction") {
      const obj: any = JsonBuffer.parseJsonWithBuffers(rpc.req.buffer.toString("utf8"));
      const message = <types.NewTransactionBroadcastMessage>obj;
      const txid = new TransactionHelper(message.transaction).calculateTransactionId();
      if (this.pendingTransactionPool.hasTransactionWithId(txid)) {
        throw new Error(`Transaction with id ${txid} already exists in the pending transaction pool`);
      } else if (this.committedTransactionPool.hasTransactionWithId(txid)) {
        throw new Error(`Transaction with id ${txid} already exists in the committed transaction pool`);
      } else {
        await this.pendingTransactionPool.onNewBroadcastTransaction(message.transaction);
      }
    }
  }


}
