import * as _ from "lodash";

import { logger, types, config } from "orbs-core-library";
import { Service } from "orbs-core-library";
import { BlockStorage, BlockStorageSync } from "orbs-core-library";

export default class BlockStorageService extends Service {
  private blockStorage: BlockStorage;
  private syncFrom: string;
  private sync: BlockStorageSync;
  private gossip: types.GossipClient;
  private nodeName: string;

  public constructor(topology?: any) {
    super(topology);
    this.nodeName = config.get("NODE_NAME");
  }

  async initialize() {
    await this.initBlockStorage();
    this.gossip = this.peers.gossip;

    this.askForHeartbeats([this.peers.gossip]);

    setInterval(() => {
      this.pollForNewBlocks();
    }, 5000);
  }

  async initBlockStorage(): Promise<void> {
    this.blockStorage = new BlockStorage();
    await this.blockStorage.load();
    this.sync = new BlockStorageSync(this.blockStorage);
  }

  async stop(): Promise<void> {
    return this.blockStorage.shutdown();
  }

  @Service.RPCMethod
  public async hasNewBlocks(rpc: types.HasNewBlocksContext) {
    return this.blockStorage.hasNewBlocks(rpc.req.blockId);
  }

  @Service.RPCMethod
  public async addBlock(rpc: types.AddBlockContext) {
    if (this.isSyncing()) {
      const message = `Block storage can't add new blocks while syncing`;
      logger.error(message);
      throw new Error(message);
    }

    await this.blockStorage.addBlock(rpc.req.block);

    rpc.res = {};
  }

  @Service.RPCMethod
  public async getLastBlockId(rpc: types.GetLastBlockIdContext) {
    rpc.res = { blockId: await this.blockStorage.getLastBlockId() };
  }

  @Service.RPCMethod
  public async getBlocks(rpc: types.GetBlocksContext) {
    rpc.res = { blocks: await this.blockStorage.getBlocks(rpc.req.lastBlockId) };
  }

  async pollForNewBlocks() {
    await this.sync.appendBlocks();

    const blockId = await this.blockStorage.getLastBlockId();

    logger.debug("Polling for new blocks", { lastBlockId: blockId });

    this.gossip.broadcastMessage({
      BroadcastGroup: "blockStorage",
      MessageType: "HasNewBlocksMessage",
      Buffer: new Buffer(JSON.stringify({ blockId })),
      Immediate: true
    });
  }

  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    logger.warn("Block storage received new message", {FromAddress: rpc.req.FromAddress, Buffer: rpc.req.Buffer.toString("utf8")});

    const { MessageType, FromAddress } = rpc.req;
    const obj = JSON.parse(rpc.req.Buffer.toString("utf8"));

    if (MessageType === "HasNewBlocksMessage") {
      // Ignore my own messages
      if (FromAddress === this.nodeName) return;

      const hasNewBlocks = await this.blockStorage.hasNewBlocks(obj.blockId);

      if (!hasNewBlocks) {
        if (FromAddress === this.syncFrom) {
          this.syncFrom = undefined;
        }

        return;
      }

      this.gossip.unicastMessage({
        Recipient: FromAddress,
        BroadcastGroup: "blockStorage",
        MessageType: "HasNewBlocksResponse",
        Buffer: new Buffer(JSON.stringify({ hasNewBlocks })),
        Immediate: true,
      });
    } else if (MessageType === "HasNewBlocksResponse") {
      logger.info(`Block storage has a peer with more blocks`, { peer: FromAddress });

      if (!this.isSyncing()) {
        this.syncFrom = FromAddress;
      }

      const blockId = await this.blockStorage.getLastBlockId();

      this.gossip.unicastMessage({
        Recipient: this.syncFrom,
        BroadcastGroup: "blockStorage",
        MessageType: "SendNewBlocks",
        Buffer: new Buffer(JSON.stringify({ blockId })),
        Immediate: true,
      });
    } else if (MessageType === "SendNewBlocks") {
      logger.info(`Block storage received request for new blocks from ${FromAddress}`);

      const blocks = await this.blockStorage.getBlocks(obj.blockId);

      blocks.forEach(async (block) => {
        this.gossip.unicastMessage({
          Recipient: FromAddress,
          BroadcastGroup: "blockStorage",
          MessageType: "SendNewBlocksResponse",
          Buffer: new Buffer(JSON.stringify({ block })),
          Immediate: true,
        });
      });
    } else if (MessageType === "SendNewBlocksResponse") {
      logger.info(`Block storage received a new block via sync`);

      if (!this.isSyncing()) {
        logger.error(`Block storaged dropped new block received via sync because it is not syncing right now`);
        return;
      }

      if (FromAddress !== this.syncFrom) {
        logger.info(`Block storaged dropped new block received via sync because it came from ${FromAddress} instead of ${this.syncFrom}`);
        return;
      }

      this.sync.onReceiveBlock(obj.block);
    } else {
      logger.debug(`Not implemented`, rpc.req);
    }
  }

  public isSyncing(): boolean {
    return this.syncFrom !== undefined;
  }
}
