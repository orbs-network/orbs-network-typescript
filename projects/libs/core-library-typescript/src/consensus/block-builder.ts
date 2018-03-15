import { types } from "../common-library";

export default class BlockBuilder {
  private virtualMachine: types.VirtualMachineClient;
  private transactionPool: types.TransactionPoolClient;

  constructor(input: { virtualMachine: types.VirtualMachineClient, transactionPool: types.TransactionPoolClient }) {
    this.virtualMachine = input.virtualMachine;
    this.transactionPool = input.transactionPool;
  }

  public async buildNextBlock(lastBlockId: number) {
    const { transactions } = await this.transactionPool.getAllPendingTransactions({});

    if (transactions.length == 0) {
      throw new Error("Transaction pool is empty");
    }

    const { processedTransactions, stateDiff, rejectedTransactions } = await this.virtualMachine.processTransactionSet({ orderedTransactions: transactions });

    this.transactionPool.clearPendingTransactions({ transactions: rejectedTransactions });

    if (processedTransactions.length == 0) {
      throw "none of the transactions processed successfully. not building a new block";
    }

    const block: types.Block = {
      header: {
        version: 0,
        id: lastBlockId + 1,
        prevBlockId: lastBlockId
      },
      transactions: processedTransactions,
      stateDiff,
    };
    return block;
  }
}
