import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import * as fsExtra from "fs-extra";

import { types } from "../../src/common-library/types";
import { BlockStorage } from "../../src/block-storage/block-storage";
import { BlockUtils } from "../../src/common-library";


const LEVELDB_PATH = "/tmp/leveldb-test";

async function initBlockStorage(transactionPool: types.TransactionPoolClient): Promise<BlockStorage> {
  const blockStorage = new BlockStorage(LEVELDB_PATH, transactionPool);
  await blockStorage.load();
  return blockStorage;
}

function generateEmptyBlock(lastBlock: types.Block): types.Block {
  return BlockUtils.buildNextBlock({
    transactions: [],
    transactionReceipts: [],
    stateDiff: []
  }, lastBlock);
}

describe("Block storage", () => {
  let blockStorage: BlockStorage;
  let lastBlock: types.Block;
  let transactionPool: types.TransactionPoolClient;


  beforeEach(async () => {
    try {
      fsExtra.removeSync(LEVELDB_PATH);
    } catch (e) { }
    transactionPool = stubInterface<types.TransactionPoolClient>();
    blockStorage = await initBlockStorage(transactionPool);
    lastBlock = await blockStorage.getLastBlock();
  });

  afterEach(async () => {
    await blockStorage.shutdown();
    blockStorage = undefined;
  });

  describe("has genesis block", () => {
    it("on initialization", async () => {
      expect(lastBlock).to.not.be.undefined;
      expect(lastBlock.header.height).to.be.eql(0);
    });
  });

  describe("#getBlock", () => {
    it("returns a block", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);

      await blockStorage.addBlock(exampleBlock);
      const block = await blockStorage.getBlock(1);
      expect(block).to.be.eql(exampleBlock);
    });
  });

  describe("#addBlock", () => {
    it("adds a new block", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);

      await blockStorage.addBlock(exampleBlock);
      const block = await blockStorage.getLastBlock();
      expect(block).to.not.be.undefined;
      expect(block.header.height).to.be.eql(1);
    });

    xit("checks previous block hash", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);
      exampleBlock.header.prevBlockHash = Buffer.concat([exampleBlock.header.prevBlockHash, new Buffer("noise")]);

      const result = blockStorage.addBlock(exampleBlock);
      // do not remove return
      await expect(result).to.eventually.be.rejectedWith(Error);
    });

    it("checks block height", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);
      exampleBlock.header.height += 1;

      const result = blockStorage.addBlock(exampleBlock);
      await expect(result).to.eventually.be.rejectedWith(Error);
    });

    it("reports transactions back to pool", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);

      await blockStorage.addBlock(exampleBlock);
      await expect(transactionPool.markCommittedTransactions).to.have.been.calledOnce;
    });

    xit("verifies block hash");
  });

  describe("#hasNewBlocks", () => {
    it("returns appropriate values", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);

      await blockStorage.addBlock(exampleBlock);

      await expect(blockStorage.hasNewBlocks(0)).to.eventually.be.true;
      await expect(blockStorage.hasNewBlocks(1000)).to.eventually.be.false;
    });
  });

  describe("#getBlocks", () => {
    it("returns array of blocks starting from blockNumber", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);

      await blockStorage.addBlock(exampleBlock);

      await expect(blockStorage.getBlocks(lastBlock.header.height)).to.eventually.be.eql([exampleBlock]);
    });
  });
});
