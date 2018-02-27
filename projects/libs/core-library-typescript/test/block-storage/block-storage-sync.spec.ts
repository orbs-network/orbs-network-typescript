import { types } from "../../src/common-library/types";
import { BlockStorage } from "../../src/block-storage/block-storage";
import { BlockStorageSync } from "../../src/block-storage/block-storage-sync";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as fsExtra from "fs-extra";

async function init(): Promise<any> {
  const blockStorage = new BlockStorage();
  await blockStorage.load();
  const blockStorageSync = new BlockStorageSync(blockStorage);
  return { blockStorage, blockStorageSync };
}

function generateBlock(prevBlockId: number): types.Block {
  return {
    header: {
      version: 0,
      id: prevBlockId + 1,
      prevBlockId: prevBlockId
    },
    tx: { contractAddress: "0", sender: "", signature: "", payload: "{}" },
    modifiedAddressesJson: "{}"
  };
}

describe("Block storage sync", () => {
  let blockStorage: BlockStorage;
  let blockStorageSync: BlockStorageSync;

  beforeEach(async () => {
    try {
        fsExtra.removeSync(BlockStorage.LEVELDB_PATH);
    } catch (e) { }

    const results = await init();
    blockStorage = results.blockStorage;
    blockStorageSync = results.blockStorageSync;
  });

  afterEach(async () => {
    await blockStorage.shutdown();
    blockStorage = undefined;
    blockStorageSync = undefined;
  });

  describe("queue", () => {
    it("accepts new blocks", () => {
      blockStorageSync.getQueueSize().should.be.eql(0);

      blockStorageSync.onReceiveBlock(generateBlock(0));

      blockStorageSync.getQueueSize().should.be.eql(1);
    });
  });

  describe("#appendBlocks", () => {
    it("does not care about order of the blocks", async () => {
      const blocks = [
        generateBlock(0),
        generateBlock(1),
        generateBlock(2),
        generateBlock(3)
      ];

      blockStorageSync.onReceiveBlock(blocks[1]);
      blockStorageSync.onReceiveBlock(blocks[2]);
      blockStorageSync.onReceiveBlock(blocks[0]);
      blockStorageSync.onReceiveBlock(blocks[3]);

      blockStorageSync.getQueueSize().should.be.eql(4);
      await blockStorageSync.appendBlocks();
      blockStorageSync.getQueueSize().should.be.eql(0);

      await blockStorage.getBlocks(0).should.eventually.be.eql(blocks);
      await blockStorage.getBlocks(4).should.eventually.be.empty;
    });

    it("does not return blocks back to the queue in case something happends", async () => {
      const blocks = [
        generateBlock(0),
        generateBlock(1),
        generateBlock(2),
        generateBlock(3),
        generateBlock(5)
      ];

      blockStorageSync.onReceiveBlock(blocks[1]);
      blockStorageSync.onReceiveBlock(blocks[2]);
      blockStorageSync.onReceiveBlock(blocks[0]);
      blockStorageSync.onReceiveBlock(blocks[4]);
      blockStorageSync.onReceiveBlock(blocks[3]);

      blockStorageSync.getQueueSize().should.be.eql(5);

      const appendBlocksPromise = blockStorageSync.appendBlocks();
      try {
        await appendBlocksPromise;
      } catch (e) { }

      appendBlocksPromise.should.eventually.be.rejected;
      blockStorageSync.getQueueSize().should.be.eql(0);

      await blockStorage.getBlocks(0).should.eventually.be.eql(blocks.slice(0, 4));
      await blockStorage.getBlocks(4).should.eventually.be.empty;
    });
  });
});
