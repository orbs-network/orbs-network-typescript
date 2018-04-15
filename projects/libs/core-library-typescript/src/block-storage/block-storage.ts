import * as path from "path";

import { LevelDBDriver } from "./leveldb-driver";
import { BlockUtils , logger, types, JsonBuffer, TransactionUtils } from "../common-library";

export class BlockStorage {
  public static readonly LAST_BLOCK_HEIGHT_KEY: string = "last";

  private lastBlock: types.Block;
  private db: LevelDBDriver;
  private transactionPool: types.TransactionPoolClient;

  public constructor(dbPath: string, transactionPool: types.TransactionPoolClient) {
    // Open/create the blocks LevelDB database.
    this.db = new LevelDBDriver(dbPath);
    this.transactionPool = transactionPool;
  }

  public async generateGenesisBlock(): Promise<types.Block> {
    return BlockUtils.buildNextBlock({
      transactions: [],
      transactionReceipts: [],
      stateDiff: []
    });
  }

  public async load(): Promise<void> {
    // Get the ID of the last block and use it to get actual block.
    let lastBlockHeight;
    try {
      lastBlockHeight = await this.db.get<number>(BlockStorage.LAST_BLOCK_HEIGHT_KEY);
    } catch (e) {
      if (e.notFound) {
        logger.warn("Couldn't get last block height. Restarting from the genesis block...");

        const genesisBlock = await this.generateGenesisBlock();

        await this.db.put<number>(BlockStorage.LAST_BLOCK_HEIGHT_KEY, genesisBlock.header.height);

        await this.putBlock(genesisBlock);

        lastBlockHeight = genesisBlock.header.height;
      } else {
        throw e;
      }
    }

    logger.info(`Got last block height: ${lastBlockHeight}`);

    this.lastBlock = await this.getBlock(lastBlockHeight);
  }

  public async shutdown() {
    logger.info(`Shutting down block storage`);
    return this.db.close();
  }

  // Adds new block to the persistent block storage.
  //
  // NOTE: this method should be only called serially.
  public async addBlock(block: types.Block) {
    this.verifyNewBlock(block);

    await this.db.put<number>(BlockStorage.LAST_BLOCK_HEIGHT_KEY, block.header.height);
    await this.putBlock(block);
    await this.reportBlockTransactionToPool(block);

    this.lastBlock = block;

    logger.info(`Added new block with block height: ${block.header.height}`);
  }

  private async reportBlockTransactionToPool(block: types.Block) {
    const transactionEntries: types.CommittedTransactionEntry[] = block.body.transactions.map(transaction => ({
      txHash: TransactionUtils.calculateTransactionHash(transaction),
      timestamp: transaction.header.timestamp
    }));
    await this.transactionPool.markCommittedTransactions({ transactionEntries });
  }

  // Returns an array of blocks, starting from a specific block ID and up to the last block.
  public async getBlocks(fromLastBlockHeight: number): Promise<types.Block[]> {
    const blocks: types.Block[] = [];

    // lastBlock is undefined when the service did not initialize the logic/load() did not run yet
    if (this.lastBlock === undefined) {
      throw new Error("Block Storage not initiailized");
    }

    for (let i = fromLastBlockHeight; i < this.lastBlock.header.height; ++i) {
      blocks.push(await this.getBlock(i + 1));
    }

    return blocks;
  }

  public async getLastBlock(): Promise<types.Block> {
    return this.lastBlock;
  }

  public async hasNewBlocks(fromLastBlockHeight: number): Promise<boolean> {
    return (await this.getLastBlock()).header.height > fromLastBlockHeight;
  }

  private verifyNewBlock(block: types.Block) {
    if (block.header.version !== 0) {
      throw new Error(`Invalid block version: ${block.header.version}!`);
    }

    if (block.header.height !== this.lastBlock.header.height + 1) {
      throw new Error(`Invalid block height of block: ${JSON.stringify(block)}!`);
    }

    const lastBlockHash = BlockUtils.calculateBlockHash(this.lastBlock);
    if (!block.header.prevBlockHash.equals(lastBlockHash)) {
      throw new Error(`Invalid prev block hash of block: ${JSON.stringify(block)}! Should have been ${JSON.stringify(lastBlockHash)}`);
    }
  }

  public async getBlock(height: number): Promise<types.Block> {
    return JsonBuffer.parseJsonWithBuffers(await this.db.get<string>(height.toString()));
  }

  private async putBlock(block: types.Block): Promise<void> {
    await this.db.put<string>(block.header.height.toString(), JSON.stringify(block));
  }
}
