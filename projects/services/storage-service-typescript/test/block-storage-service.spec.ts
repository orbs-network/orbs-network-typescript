import { types } from "orbs-common-library";
import { BlockStorage } from "orbs-core-library";
import BlockStorageService from "../src/block-storage-service";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as fsExtra from "fs-extra";

describe("Block storage service", () => {
  let blockStorageService: BlockStorageService;

  beforeEach(async () => {
    try {
        fsExtra.removeSync(BlockStorage.LEVELDB_PATH);
    } catch (e) { }

    blockStorageService = new BlockStorageService();
    await blockStorageService.initialize();
  });

  afterEach(async () => {
      await blockStorageService.stop();
      blockStorageService = undefined;
  });

  describe("sync process", () => {
    it("#pollForNewBlocks");
  });
});
