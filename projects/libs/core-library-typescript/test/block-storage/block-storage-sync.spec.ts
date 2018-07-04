import * as path from "path";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as fsExtra from "fs-extra";

import { types, BlockUtils } from "../../src/common-library";
import { BlockStorage } from "../../src/block-storage/block-storage";
import { BlockStorageSync } from "../../src/block-storage/block-storage-sync";
import { stubInterface } from "ts-sinon";

const LEVELDB_PATH = "/tmp/leveldb-test";

chai.use(chai.should);

async function init(): Promise<{blockStorage: BlockStorage, blockStorageSync: BlockStorageSync}> {
  fsExtra.removeSync(LEVELDB_PATH);
  const transactionPool = stubInterface<types.TransactionPoolClient>();
  const blockStorage = new BlockStorage({ dbPath: LEVELDB_PATH, verifySignature: false }, transactionPool);
  await blockStorage.load();
  const blockStorageSync = new BlockStorageSync(blockStorage);
  return { blockStorage, blockStorageSync };
}

function generateEmptyBlock(lastBlock: types.Block): types.Block {
  return BlockUtils.buildNextBlock({transactions: [], transactionReceipts: [], stateDiff: []}, lastBlock);
}

async function generateBlocks(blockStorage: BlockStorage, numOfBlocks: number) {
  const blocks = [];
  let lastBlock = await blockStorage.getLastBlock();
  for (let i = 0; i < numOfBlocks; i++) {
    lastBlock = generateEmptyBlock(lastBlock);
    blocks.push(lastBlock);
  }
  return blocks;
}

describe("Block storage sync", () => {
  let blockStorage: BlockStorage;
  let blockStorageSync: BlockStorageSync;

  beforeEach(async () => {
    const results  = await init();
    blockStorage = results.blockStorage;
    blockStorageSync = results.blockStorageSync;
  });

  afterEach(async () => {
    if (blockStorage) {
      await blockStorage.shutdown();
    }
    blockStorage = undefined;
    blockStorageSync = undefined;
  });

  describe("queue", () => {
    it("accepts new blocks", async () => {
      blockStorageSync.getQueueSize().should.be.eql(0);

      const lastBlock = await blockStorage.getLastBlock();

      blockStorageSync.onReceiveBlock(await generateEmptyBlock(lastBlock));

      blockStorageSync.getQueueSize().should.be.eql(1);
    });
  });

  describe("#appendBlocks", () => {
    it("does not care about order of the blocks", async () => {
      const blocks = await generateBlocks(blockStorage, 4);

      blockStorageSync.onReceiveBlock(blocks[1]);
      blockStorageSync.onReceiveBlock(blocks[2]);
      blockStorageSync.onReceiveBlock(blocks[0]);
      blockStorageSync.onReceiveBlock(blocks[3]);

      blockStorageSync.getQueueSize().should.eql(4);
      await blockStorageSync.appendBlocks();
      blockStorageSync.getQueueSize().should.eql(0);

      await blockStorage.getBlocks(0, 100000).should.eventually.eql(blocks);
      await blockStorage.getBlocks(4, 100000).should.eventually.be.empty;
    });

    it("does not care about duplicate blocks", async () => {
      const blocks = await generateBlocks(blockStorage, 4);

      blockStorageSync.onReceiveBlock(blocks[1]);
      blockStorageSync.onReceiveBlock(blocks[2]);
      blockStorageSync.onReceiveBlock(blocks[0]);
      blockStorageSync.onReceiveBlock(blocks[3]);
      blockStorageSync.onReceiveBlock(blocks[3]);
      blockStorageSync.onReceiveBlock(blocks[2]);

      blockStorageSync.getQueueSize().should.be.eql(6);
      await blockStorageSync.appendBlocks();
      blockStorageSync.getQueueSize().should.be.eql(0);

      await blockStorage.getBlocks(0, 100000).should.eventually.be.eql(blocks);
      await blockStorage.getBlocks(4, 100000).should.eventually.be.empty;
    });

    it("does not return blocks back to the queue in case something happens", async () => {
      const blocks = await generateBlocks(blockStorage, 6);
      // removing a block from the array to make it non-continuous
      blocks.splice(4, 1);


      blockStorageSync.onReceiveBlock(blocks[1]);
      blockStorageSync.onReceiveBlock(blocks[2]);
      blockStorageSync.onReceiveBlock(blocks[0]);
      blockStorageSync.onReceiveBlock(blocks[4]);
      blockStorageSync.onReceiveBlock(blocks[3]);

      blockStorageSync.getQueueSize().should.eql(5);

      await blockStorageSync.appendBlocks();

      await blockStorage.getBlocks(blocks[0].header.height - 1, 100000).should.eventually.eql(blocks.slice(0, 4));
      await blockStorage.getBlocks(blocks[4].header.height - 1, 100000).should.eventually.be.empty;
    });
  });
});
