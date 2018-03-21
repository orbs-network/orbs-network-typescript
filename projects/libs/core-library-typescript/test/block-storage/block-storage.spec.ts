import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as fsExtra from "fs-extra";

import { types } from "../../src/common-library/types";
import { BlockStorage } from "../../src/block-storage/block-storage";
import { BlockUtils } from "../../src/common-library";

const LEVELDB_PATH = "/tmp/leveldb-test";

async function initBlockStorage(): Promise<BlockStorage> {
  const blockStorage = new BlockStorage(LEVELDB_PATH);
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


  beforeEach(async () => {
    try {
      fsExtra.removeSync(LEVELDB_PATH);
    } catch (e) { }
    blockStorage = await initBlockStorage();
    lastBlock = await blockStorage.getLastBlock();
  });

  afterEach(async () => {
    await blockStorage.shutdown();
    blockStorage = undefined;
  });

  describe("has genesis block", () => {
    it("on initialization", async () => {
      lastBlock.should.not.be.undefined;
      lastBlock.header.height.should.be.eql(0);
    });
  });

  describe("#getBlock", () => {
    it("returns a block", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);

      await blockStorage.addBlock(exampleBlock);
      const block = await blockStorage.getBlock(1);
      block.should.be.eql(exampleBlock);
    });
  });

  describe("#addBlock", () => {
    it("adds a new block", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);

      await blockStorage.addBlock(exampleBlock);
      const block = await blockStorage.getLastBlock();
      block.should.not.be.undefined;
      block.header.height.should.be.eql(1);
    });

    xit("checks previous block hash", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);
      exampleBlock.header.prevBlockHash = Buffer.concat([exampleBlock.header.prevBlockHash, new Buffer("noise")]);

      const result = blockStorage.addBlock(exampleBlock);
      // do not remove return
      await result.should.eventually.be.rejectedWith(Error);
    });

    it("checks block height", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);
      exampleBlock.header.height += 1;

      const result = blockStorage.addBlock(exampleBlock);
      await result.should.eventually.be.rejectedWith(Error);
    });

    xit("verifies block hash");
  });

  describe("#hasNewBlocks", () => {
    it("returns appropriate values", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);

      await blockStorage.addBlock(exampleBlock);

      await blockStorage.hasNewBlocks(0).should.eventually.be.true;
      await blockStorage.hasNewBlocks(1000).should.eventually.be.false;
    });
  });

  describe("#getBlocks", () => {
    it("returns array of blocks starting from blockNumber", async () => {
      const exampleBlock: types.Block = generateEmptyBlock(lastBlock);

      await blockStorage.addBlock(exampleBlock);

      await blockStorage.getBlocks(lastBlock.header.height).should.eventually.be.eql([exampleBlock]);
    });
  });
});
