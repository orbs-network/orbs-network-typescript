import { types, logger, BlockUtils } from "../common-library";

export default class BlockBuilder {
  private virtualMachine: types.VirtualMachineClient;
  private transactionPool: types.TransactionPoolClient;
  private pollIntervalMs: number;
  private blockSizeLimit: number;
  private pollInterval: NodeJS.Timer;
  private lastBlock: types.Block;
  private blockStorage: types.BlockStorageClient;
  private onNewBlockBuild: (block: types.Block) => void;

  constructor(input: {
    virtualMachine: types.VirtualMachineClient,
    transactionPool: types.TransactionPoolClient,
    blockStorage: types.BlockStorageClient,
    newBlockBuildCallback: (block: types.Block) => void,
    pollIntervalMs?: number,
    blockSizeLimit?: number
  }) {
      this.virtualMachine = input.virtualMachine;
      this.transactionPool = input.transactionPool;
      this.blockStorage = input.blockStorage;
      this.onNewBlockBuild = input.newBlockBuildCallback;
      this.pollIntervalMs = input.pollIntervalMs || 500;
      this.blockSizeLimit = input.blockSizeLimit || 2000;
  }

  private pollForPendingTransactions() {
    if (this.pollInterval) {
      return;
    }
    this.pollInterval = setInterval(async () => {
      try {
        logger.debug("blockBuilder tick");
        await this.appendNextBlock();
      } catch (err) {
        logger.error(`newBlockAppendTick error: ${JSON.stringify(err)}`);
      }
    }, this.pollIntervalMs);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      delete this.pollInterval;
    }
  }

  // public getPendingTransactionsBlock(blockSize: number): types.TransactionEntry[] {
  //   const transactionEntries: types.TransactionEntry[] = [];
  //   for (const [txid, transaction] of [...this.pendingTransactions.entries()].sort().slice(0, blockSize)) {
  //     const txHash = Buffer.from(txid, "hex");
  //     transactionEntries.push({txHash, transaction});
  //   }
  //   return transactionEntries;
  // }


  private async buildBlockFromPendingTransactions(lastBlock: types.Block): Promise<types.Block> {
    const { transactionEntries } = await this.transactionPool.getAllPendingTransactions({});
    const transactionEntriesCap: types.TransactionEntry[] = transactionEntries.slice(0, this.blockSizeLimit);

    if (transactionEntriesCap.length == 0) {
        logger.error(`not an error: EMPTY POOL`);
        return undefined;
    }

    const { transactionReceipts, stateDiff } = await this.virtualMachine.processTransactionSet({ orderedTransactions: transactionEntriesCap });

    return BlockUtils.buildNextBlock({
      transactions: transactionEntriesCap.map(entry => entry.transaction),
      transactionReceipts,
      stateDiff
    }, lastBlock);
  }

  public start() {
    this.pollForPendingTransactions();
    logger.debug("blockBuilder starting..");
  }

  public stop() {
    this.stopPolling();
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

  // Append a new block to log. Only called on leader elected or after committed.
  // while pool is empty retry every time interval
  public async appendNextBlock(): Promise<types.Block> {

    this.stop();
    try {
      const lastBlock = await this.getOrFetchLastBlock();
      const block = await this.buildBlockFromPendingTransactions(lastBlock);

      if (block == undefined) {
        this.pollInterval = setInterval(async () => {
          try {
            logger.debug("blockBuilder tick");
            this.appendNextBlock();
          } catch (err) {
            logger.error(`buildBlockFromPendingTransactions error: ${JSON.stringify(err)}`);
          }
        }, this.pollIntervalMs);
      }
      else {
        // this.stopPolling();
        const blockHash = BlockUtils.calculateBlockHash(block).toString("hex");
        logger.info(`Appended new block with block height ${block.header.height} and hash ${blockHash}`);
        this.onNewBlockBuild(block);
        return block;
      }
    } catch (e) {
      // this.start();
      throw e;
    }

    // FIXME: test if new implementation works with stub consensus, old code commented out for reference and should be removed

    // const lastBlock = await this.getOrFetchLastBlock();
    // const block = await this.buildBlockFromPendingTransactions(lastBlock);

    // this.stopPolling();

    // this.onNewBlockBuild(block);

    // logger.debug(`Appended new block ${JSON.stringify(block)}`);

    // return block;
  }


  async initialize() {
  }

  async shutdown() {
    this.stopPolling();
  }
}
