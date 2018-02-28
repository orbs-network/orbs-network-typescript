import * as _ from "lodash";

import { logger, types } from "orbs-core-library";
import { BlockStorage, BlockStorageSync } from "orbs-core-library";
import { Service, ServiceConfig } from "orbs-core-library";

export interface BlockStorageServiceConfig extends ServiceConfig {
  dbPath: string;
}

export default class BlockStorageService extends Service {
  private blockStorage: BlockStorage;
  private sync: BlockStorageSync;
  private gossip: types.GossipClient;
  private pollForNewBlocksInterval: any;

  public constructor(gossip: types.GossipClient, serviceConfig: BlockStorageServiceConfig) {
    super(serviceConfig);
    this.gossip = gossip;
  }

  async initialize() {
    await this.initBlockStorage();

    this.pollForNewBlocksInterval = setInterval(() => {
      this.pollForNewBlocks();
    }, 5000);
  }

  async initBlockStorage(): Promise<void> {
    const blockStorageConfig = <BlockStorageServiceConfig>this.config;
    this.blockStorage = new BlockStorage(blockStorageConfig.dbPath);
    await this.blockStorage.load();
    this.sync = new BlockStorageSync(this.blockStorage);
  }

  async shutdown() {
    clearInterval(this.pollForNewBlocksInterval);
    return this.blockStorage.shutdown();
  }

  @Service.RPCMethod
  public async hasNewBlocks(rpc: types.HasNewBlocksContext) {
    return this.blockStorage.hasNewBlocks(rpc.req.blockId);
  }

  @Service.RPCMethod
  public async addBlock(rpc: types.AddBlockContext) {
    if (this.isSyncing()) {
      const message = `Block storage ${this.config.nodeName} can't add new blocks while syncing`;
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

    logger.debug(`Block storage ${this.config.nodeName} is polling for new blocks`, { lastBlockId: blockId });

    this.gossip.broadcastMessage({
      BroadcastGroup: "blockStorage",
      MessageType: "HasNewBlocksMessage",
      Buffer: new Buffer(JSON.stringify({ blockId })),
      Immediate: true
    });
  }

  @Service.RPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const { messageType, fromAddress } = rpc.req;
    const payload = JSON.parse(rpc.req.buffer.toString("utf8"));

    switch (messageType) {
      case "HasNewBlocksMessage":
        this.onHasNewBlocksMessage(fromAddress, payload);
        break;
      case "HasNewBlocksResponse":
        this.onHasNewBlocksResponse(fromAddress, payload);
        break;
      case "SendNewBlocks":
        this.onSendNewBlocks(fromAddress, payload);
        break;
      case "SendNewBlocksResponse":
        this.onSendNewBlocksResponse(fromAddress, payload);
        break;
    }
  }

  async onHasNewBlocksMessage(fromAddress: string, payload: any) {
    // Ignore my own messages
    if (fromAddress === this.config.nodeName) {
      return;
    }

    const hasNewBlocks = await this.blockStorage.hasNewBlocks(payload.blockId);

    this.gossip.unicastMessage({
      Recipient: fromAddress,
      BroadcastGroup: "blockStorage",
      MessageType: "HasNewBlocksResponse",
      Buffer: new Buffer(JSON.stringify({ hasNewBlocks })),
      Immediate: true,
    });
  }

  async onHasNewBlocksResponse(fromAddress: string, payload: any) {
    if (!payload.hasNewBlocks && this.sync.isSyncingWith(fromAddress)) {
      this.sync.off();
      logger.info(`Block storage ${this.config.nodeName} stopped syncing with node`, { peer: fromAddress });
      return;
    }

    if (payload.hasNewBlocks) {
      logger.info(`Block storage ${this.config.nodeName} has a peer with more blocks`, { peer: fromAddress });
    }

    if (payload.hasNewBlocks && !this.isSyncing()) {
      this.sync.on(fromAddress);
      logger.info(`Block storage ${this.config.nodeName} starts to sync with node`, { peer: fromAddress });

      const blockId = await this.blockStorage.getLastBlockId();

      this.gossip.unicastMessage({
        Recipient: this.sync.getNode(),
        BroadcastGroup: "blockStorage",
        MessageType: "SendNewBlocks",
        Buffer: new Buffer(JSON.stringify({ blockId })),
        Immediate: true,
      });
    }
  }

  async onSendNewBlocks(fromAddress: string, payload: any) {
    logger.info(`Block storage ${this.config.nodeName} received request for new blocks from ${fromAddress}`);

    const blocks = await this.blockStorage.getBlocks(payload.blockId);

    blocks.forEach(async (block) => {
      this.gossip.unicastMessage({
        Recipient: fromAddress,
        BroadcastGroup: "blockStorage",
        MessageType: "SendNewBlocksResponse",
        Buffer: new Buffer(JSON.stringify({ block })),
        Immediate: true,
      });
    });
  }

  async onSendNewBlocksResponse(fromAddress: string, payload: any) {
    logger.info(`Block storage ${this.config.nodeName} received a new block via sync`);

    if (!this.isSyncing()) {
      logger.error(`Block storaged ${this.config.nodeName} dropped new block received via sync because it is not syncing right now`);
      return;
    }

    if (!this.sync.isSyncingWith(fromAddress)) {
      logger.info(`Block storaged ${this.config.nodeName} dropped new block received via sync because it came from ${fromAddress} instead of ${this.sync.getNode()}`);
      return;
    }

    this.sync.onReceiveBlock(payload.block);
  }

  public isSyncing(): boolean {
    return this.sync.isSyncing();
  }
}
