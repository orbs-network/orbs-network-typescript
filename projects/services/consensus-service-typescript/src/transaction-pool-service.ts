import bind from "bind-decorator";

import { types, logger, JsonBuffer } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { PendingTransactionPool, CommittedTransactionPool } from "orbs-core-library";

export default class TransactionPoolService extends Service {
  private pendingTransactionPool: PendingTransactionPool;
  private committedTransactionPool: CommittedTransactionPool;
  private monitorPollTimer: NodeJS.Timer;
  private monitorPollIntervalMs = 2000;

  public constructor(pendingTransactionPool: PendingTransactionPool, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.pendingTransactionPool = pendingTransactionPool;
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
    this.pendingTransactionPool.markCommittedTransactions(rpc.req.transactionReceipts);
    rpc.res = {};
  }

  @Service.RPCMethod
  public async addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext) {
     await this.pendingTransactionPool.addNewPendingTransaction(rpc.req.transaction);
     rpc.res = {};
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
    this.pendingTransactionPool.getTransactionStatus(txid);
  }

  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const obj: any = JsonBuffer.parseJsonWithBuffers(rpc.req.buffer.toString("utf8"));
    if (rpc.req.messageType === "newTransaction") {
      const message = <types.NewTransactionBroadcastMessage>obj;
      await this.pendingTransactionPool.onNewBroadcastTransaction(message.transaction);
    }
  }


}
