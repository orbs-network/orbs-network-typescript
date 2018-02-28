import * as path from "path";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as fsExtra from "fs-extra";

import { types } from "../../src/common-library/types";
import { BlockStorage } from "../../src/block-storage/block-storage";

const LEVEL_DB_PATH = path.resolve("../../../../../db/test/blocks.db.ut");

async function initBlockStorage(): Promise<BlockStorage> {
  const blockStorage = new BlockStorage(LEVEL_DB_PATH);
  await blockStorage.load();
  return blockStorage;
}

describe("Block storage", () => {
  let blockStorage: BlockStorage;

  beforeEach(async () => {
    try {
      fsExtra.removeSync(LEVEL_DB_PATH);
    } catch (e) { }
    blockStorage = await initBlockStorage();
  });

  afterEach(async () => {
    await blockStorage.shutdown();
    blockStorage = undefined;
  });

  describe("has genesis block", () => {
    it("on initialization", async () => {
      const lastBlockId = await blockStorage.getLastBlockId();
      lastBlockId.should.be.eql(0);

      const lastBlock = await blockStorage.getBlock(lastBlockId);
      lastBlock.should.be.eql(BlockStorage.GENESIS_BLOCK);
    });
  });

  describe("#getBlock", () => {
    it("returns a block", async () => {
      const exampleBlock = {
        header: {
          version: 0,
          id: 1,
          prevBlockId: 0
        },
        tx: { version: 0, contractAddress: "0", sender: "", signature: "", payload: "{}" },
        modifiedAddressesJson: "{}"
      };

      await blockStorage.addBlock(exampleBlock);
      const lastBlock = await blockStorage.getBlock(1);
      lastBlock.should.be.eql(exampleBlock);
    });
  });

  describe("#addBlock", () => {
    it("adds a new block", async () => {
      const exampleBlock = {
        header: {
          version: 0,
          id: 1,
          prevBlockId: 0
        },
        tx: { version: 0, contractAddress: "0", sender: "", signature: "", payload: "{}" },
        modifiedAddressesJson: "{}"
      };

      await blockStorage.addBlock(exampleBlock);
      const lastBlockId = await blockStorage.getLastBlockId();
      lastBlockId.should.be.eql(1);
    });

    it("checks previous block id", async () => {
      const exampleBlock = {
        header: {
          version: 0,
          id: 1,
          prevBlockId: 1
        },
        tx: { version: 0, contractAddress: "0", sender: "", signature: "", payload: "{}" },
        modifiedAddressesJson: "{}"
      };

      const result = blockStorage.addBlock(exampleBlock);
      await result.should.eventually.be.rejectedWith(Error, `Invalid prev block ID of block: ${JSON.stringify(exampleBlock)}! Should have been 0`);
    });

    it("checks block id", async () => {
      const exampleBlock = {
        header: {
          version: 0,
          id: 2,
          prevBlockId: 0
        },
        tx: { version: 0, contractAddress: "0", sender: "", signature: "", payload: "{}" },
        modifiedAddressesJson: "{}"
      };

      const result = blockStorage.addBlock(exampleBlock);
      await result.should.eventually.be.rejectedWith(Error, `Invalid block ID of block: ${JSON.stringify(exampleBlock)}!`);
    });
  });

  describe("#hasNewBlocks", () => {
    it("returns appropriate values", async () => {
      await blockStorage.hasNewBlocks(0).should.eventually.be.false;

      const exampleBlock = {
        header: {
          version: 0,
          id: 1,
          prevBlockId: 0
        },
        tx: { version: 0, contractAddress: "0", sender: "", signature: "", payload: "{}" },
        modifiedAddressesJson: "{}"
      };

      await blockStorage.addBlock(exampleBlock);

      await blockStorage.hasNewBlocks(0).should.eventually.be.true;
      await blockStorage.hasNewBlocks(1000).should.eventually.be.false;
    });
  });

  describe("#getBlocks", () => {
    it("returns array of blocks starting from blockNumber", async () => {
      await blockStorage.getBlocks(0).should.eventually.be.eql([]);

      const exampleBlock = {
        header: {
          version: 0,
          id: 1,
          prevBlockId: 0
        },
        tx: { version: 0, contractAddress: "0", sender: "", signature: "", payload: "{}" },
        modifiedAddressesJson: "{}"
      };

      await blockStorage.addBlock(exampleBlock);

      await blockStorage.getBlocks(0).should.eventually.be.eql([exampleBlock]);
    });
  });
});
