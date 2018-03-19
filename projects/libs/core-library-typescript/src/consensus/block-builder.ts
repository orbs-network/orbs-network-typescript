import { types, logger, BlockUtils } from "../common-library";

export default class BlockBuilder {
  private virtualMachine: types.VirtualMachineClient;
  private transactionPool: types.TransactionPoolClient;
  private pollIntervalMs: number;
  private pollInterval: NodeJS.Timer;
  private lastBlock: types.Block;
  private readyForBlockAppend = false;
  private blockStorage: types.BlockStorageClient;
  private onNewBlockBuild: (block: types.Block) => void;

  constructor(input: {
    virtualMachine: types.VirtualMachineClient,
    transactionPool: types.TransactionPoolClient,
    blockStorage: types.BlockStorageClient,
    newBlockBuildCallback: (block: types.Block) => void,
    pollIntervalMs?: number
  }) {
      this.virtualMachine = input.virtualMachine;
      this.transactionPool = input.transactionPool;
      this.blockStorage = input.blockStorage;
      this.onNewBlockBuild = input.newBlockBuildCallback;
      this.pollIntervalMs = input.pollIntervalMs || 500;
  }

  private pollForPendingTransactions() {
    this.pollInterval = setInterval(async () => {
      try {
        if (this.readyForBlockAppend) {
          logger.debug("blockBuilder tick");
          await this.appendNextBlock();
        }
      } catch (err) {
        logger.error("newBlockAppendTick error: " + err);
      }
    }, this.pollIntervalMs);
  }

  private async buildBlockFromPendingTransactions(lastBlock: types.Block): Promise<types.Block> {
    const { transactions } = await this.transactionPool.getAllPendingTransactions({});

    if (transactions.length == 0) {
        throw new Error("Transaction pool is empty");
    }

    const { processedTransactions, stateDiff, rejectedTransactions } = await this.virtualMachine.processTransactionSet({ orderedTransactions: transactions });

    if (rejectedTransactions.length > 0) {
      this.transactionPool.clearPendingTransactions({ transactions: rejectedTransactions });
    }

    if (processedTransactions.length == 0) {
      throw new Error("None of the transactions processed successfully. Not building a new block");
    } else {
      logger.info(`Building new block with ${processedTransactions.length} transactions`);
    }

    return BlockUtils.buildNextBlock({
      transactions: processedTransactions,
      stateDiff
    }, lastBlock);
  }

  public start() {
    this.readyForBlockAppend = true;
    logger.debug("blockBuilder starting..");
  }

  public stop() {
    this.readyForBlockAppend = false;
    logger.debug("blockBuilder stopping..");
  }

  public async commitBlock(block: types.Block) {
    await this.blockStorage.addBlock({ block });
    this.lastBlock = block;
  }

  private async getOrFetchLastBlock(): Promise<types.Block> {
    if (this.lastBlock == undefined) {
      const { block } = await this.blockStorage.getLastBlock({});
      this.lastBlock = block;
    }
    return this.lastBlock;
  }

  private async appendNextBlock() {
    const lastBlock = await this.getOrFetchLastBlock();
    const block = await this.buildBlockFromPendingTransactions(lastBlock);

    this.onNewBlockBuild(block);

    logger.debug(`appended new block ${JSON.stringify(block)}`);

    this.readyForBlockAppend = false;
  }


  async initialize() {
    this.pollForPendingTransactions();
  }

  async shutdown() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
