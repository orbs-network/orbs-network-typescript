import { types, logger, BlockUtils } from "../common-library";

export default class BlockBuilder {
  private virtualMachine: types.VirtualMachineClient;
  private transactionPool: types.TransactionPoolClient;
  private pollIntervalMs: number;
  private pollInterval: NodeJS.Timer;
  private lastBlock: types.Block;
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

  private async buildBlockFromPendingTransactions(lastBlock: types.Block): Promise<types.Block> {
    const { transactionEntries } = await this.transactionPool.getAllPendingTransactions({});

    if (transactionEntries.length == 0) {
        throw new Error("transaction pool is empty");
    }

    const { transactionReceipts, stateDiff } = await this.virtualMachine.processTransactionSet({ orderedTransactions: transactionEntries });

    return BlockUtils.buildNextBlock({
      transactions: transactionEntries.map(entry => entry.transaction),
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

  public async appendNextBlock(): Promise<types.Block> {
    const lastBlock = await this.getOrFetchLastBlock();
    const block = await this.buildBlockFromPendingTransactions(lastBlock);

    this.stopPolling();

    this.onNewBlockBuild(block);

    logger.debug(`Appended new block ${JSON.stringify(block)}`);

    return block;
  }


  async initialize() {
  }

  async shutdown() {
    this.stopPolling();
  }
}
