import { types, logger, BlockUtils, KeyManager } from "../common-library";


export interface BlockBuilderConfig {
  pollIntervalMs?: number;
  sign?: boolean;
  keyManager?: KeyManager;
  nodeName?: string;
  blockSizeLimit?: number;
}
export default class BlockBuilder {
  private virtualMachine: types.VirtualMachineClient;
  private transactionPool: types.TransactionPoolClient;
  private pollIntervalMs: number;
  private blockSizeLimit: number;
  private pollInterval: NodeJS.Timer;
  private lastBlock: types.Block;
  private blockStorage: types.BlockStorageClient;
  private onNewBlockBuild: (block: types.Block) => void;
  private config: BlockBuilderConfig;

  constructor(input: {
    virtualMachine: types.VirtualMachineClient,
    transactionPool: types.TransactionPoolClient,
    blockStorage: types.BlockStorageClient,
    newBlockBuildCallback: (block: types.Block) => void,
    config: BlockBuilderConfig
  }) {
      this.virtualMachine = input.virtualMachine;
      this.transactionPool = input.transactionPool;
      this.blockStorage = input.blockStorage;
      this.onNewBlockBuild = input.newBlockBuildCallback;

      this.config = input.config;
      this.pollIntervalMs = input.config.pollIntervalMs || 500;
      this.blockSizeLimit = input.config.blockSizeLimit || 2000;
  }

  private pollForPendingTransactions() {
    if (this.pollInterval) {
      return;
    }
    this.pollInterval = setInterval(async () => {
      try {
        await this.appendNextBlock();
      } catch (err) {
        logger.error(`Error in appendNextBlock,`, err);
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
    const transactionEntriesCap: types.TransactionEntry[] = transactionEntries.slice(0, this.blockSizeLimit);

    if (transactionEntriesCap.length == 0) {
        logger.debug(`Empty transaction pool on buildBlockFromPendingTransactions()`);
        return undefined;
    }

    const { transactionReceipts, stateDiff } = await this.virtualMachine.processTransactionSet({ orderedTransactions: transactionEntriesCap });

    const block = BlockUtils.buildNextBlock({
      transactions: transactionEntriesCap.map(entry => entry.transaction),
      transactionReceipts,
      stateDiff
    }, lastBlock);

    if (this.config.sign) {
      return BlockUtils.signBlock(block, this.config.keyManager, this.config.nodeName);
    }

    return block;
  }

  public start() {
    this.pollForPendingTransactions();
  }

  public stop() {
    this.stopPolling();
  }

  // Returns an array of blocks, starting from a specific block ID and up to the last block.
  public async getBlocks(fromLastBlockHeight: number): Promise<types.Block[]> {
    try {
      const { blocks } = await this.blockStorage.getBlocks({ lastBlockHeight: fromLastBlockHeight });
      return blocks;
    }
    catch (err) {
     return undefined;
    }
  }

  public async commitBlock(block: types.Block) {
    await this.blockStorage.addBlock({ block });
    this.lastBlock = block;
  }

  public async getOrFetchLastBlock(): Promise<types.Block> {
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
        this.start();
      }
      else {
        const blockHash = BlockUtils.calculateBlockHash(block).toString("hex");
        logger.info(`Appended new block with block height ${block.header.height} and hash ${blockHash}`);
        this.onNewBlockBuild(block);
        return block;
      }
    } catch (e) {
      this.start();
      throw e;
    }
  }

  async initialize() {
  }

  async shutdown() {
    this.stopPolling();
  }
}
