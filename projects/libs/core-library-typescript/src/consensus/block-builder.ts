import { types, logger, BlockUtils, KeyManager } from "../common-library";


export interface BlockBuilderConfig {
  pollIntervalMs?: number;
  sign?: boolean;
  keyManager?: KeyManager;
  nodeName?: string;
  blockSizeLimit?: number;
  blockSizeMin?: number;
}
export default class BlockBuilder {
  private virtualMachine: types.VirtualMachineClient;
  private transactionPool: types.TransactionPoolClient;
  private pollIntervalMs: number;
  private blockSizeLimit: number;
  private blockSizeMin: number;
  private pollInterval: NodeJS.Timer;
  private lastBlock: types.Block;
  private blockStorage: types.BlockStorageClient;
  private onNewBlockBuild: (block: types.Block) => void;
  private config: BlockBuilderConfig;
  private testing: number;

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
      this.blockSizeMin = input.config.blockSizeMin || 0;
      this.testing = 0;
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


    // ###################################### Changes pre -v1  ######################################


    public getPollingInterval(): number {
      return this.pollIntervalMs;
    }

    public async generateNewBlock(height: number): Promise<types.Block> {
      try {
        const { block } = await this.blockStorage.getBlock({ atHeight: (height - 1)});
        if (!block) {
          throw new Error(`generateNewBlock Failed to getBlock at height: ${height}`);
        }
        const newBlock: types.Block = await this.buildBlockFromPendingTransactions(block); // TODO: work on blockHeaders
        // const blockSize: number = Buffer.byteLength(JSON.stringify(newBlock), "utf8");
        const blockSize: number = newBlock.body.transactions.length;
        if (blockSize < this.blockSizeMin) {
          throw new Error(`generateNewBlock waiting for block size of at least ${this.blockSizeMin} at height: ${height}`);
        }

        // if ( newBlock ) {
        //   if (height == 5 || height == 7) {
        //     if (this.testing < 2) {
        //       this.testing++;
        //       throw new Error(`generateNewBlock Failed to getBlock at height: ${height} testing: ${this.testing}`);
        //     }
        //     this.testing = 0;
        //   }
        // }
        return newBlock;
      }
      catch (err) {
        logger.debug(`generateNewBlock Error: ${err}`);
      }
      return undefined;
    }
}
