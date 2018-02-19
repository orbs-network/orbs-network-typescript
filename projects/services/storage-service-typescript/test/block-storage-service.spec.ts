// import {  } from "orbs-common-library";
import { types, config, BlockStorage, logger } from "orbs-core-library";
import BlockStorageService from "../src/block-storage-service";
import GossipService from "../../gossip-service-typescript/src/service";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as fsExtra from "fs-extra";

const gossipNode1 = {
  name: "gossip",
  version: "1.0.0",
  endpoint: "127.0.0.1:51151",
  project: "gossip-service-typescript",
  peers: [
    // {
    //   service: "block-storage",
    //   endpoint: "127.0.0.1:51152",
    // },
  ],
  gossipPort: 60001,
  gossipPeers: [ "ws://127.0.0.1:60002" ]
};

const gossipNode2 = {
  name: "gossip",
  version: "1.0.0",
  endpoint: "127.0.0.1:61151",
  project: "gossip-service-typescript",
  peers: [
    // {
    //   service: "block-storage",
    //   endpoint: "127.0.0.1:61152",
    // },
  ],
  gossipPort: 60002,
  gossipPeers: [ "ws://127.0.0.1:60001" ]
};

const LEVELDB_PATH_1 = BlockStorage.LEVELDB_PATH + ".1";
const LEVELDB_PATH_2 = BlockStorage.LEVELDB_PATH + ".2";

describe("Block storage service", async function () {
  this.timeout(800000);

  let blockStorageService1: BlockStorageService;
  let blockStorageService2: BlockStorageService;
  let gossipService1: GossipService;
  let gossipService2: GossipService;

  beforeEach(async () => {
    try {
        fsExtra.removeSync(LEVELDB_PATH_1);
        fsExtra.removeSync(LEVELDB_PATH_2);
    } catch (e) { }

    // blockStorageService = new BlockStorageService();
    // await blockStorageService.start();
    // process.env.NODE_NAME = "node1";
    config.set("NODE_IP", "0.0.0.0");

    gossipService1 = new GossipService(gossipNode1);
    gossipService2 = new GossipService(gossipNode2);

    config.set("NODE_NAME", "node1");
    await gossipService1.initGossip();

    config.set("NODE_NAME", "node2");
    await gossipService2.initGossip();
  });

  afterEach(async () => {
      // await blockStorageService.stop();
      // blockStorageService = undefined;

      await [gossipService1.stop(), gossipService2.stop()];
  });

  describe("sync process", () => {
    it("#pollForNewBlocks", (done) => {
      logger.info("FUCK");
      setTimeout(() => {

        done();
      }, 5000);
      // done();
    });
  });
});
