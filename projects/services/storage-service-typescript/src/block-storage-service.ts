import * as _ from "lodash";

import { logger, types } from "orbs-core-library";
import { BlockStorage, BlockStorageSync } from "orbs-core-library";
import { Service, ServiceConfig } from "orbs-core-library";

export default class BlockStorageService extends Service {
  private blockStorage: BlockStorage;
  private sync: BlockStorageSync;
  private gossip: types.GossipClient;
  private pollForNewBlocksInterval: any;

  public constructor(gossip: types.GossipClient, serviceConfig: ServiceConfig) {
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
    this.blockStorage = new BlockStorage();
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
      const message = `Block storage ${this.nodeName} can't add new blocks while syncing`;
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

    logger.debug(`Block storage ${this.nodeName} is polling for new blocks`, { lastBlockId: blockId });

    this.gossip.broadcastMessage({
      BroadcastGroup: "blockStorage",
      MessageType: "HasNewBlocksMessage",
      Buffer: new Buffer(JSON.stringify({ blockId })),
      Immediate: true
    });
  }

  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    // TODO: remove when @Service.SilentRPCMethod is fixed
    logger.warn(`Block storage ${this.nodeName} received new message`, { FromAddress: rpc.req.FromAddress, Buffer: rpc.req.Buffer.toString("utf8") });

    const { MessageType, FromAddress } = rpc.req;
    const payload = JSON.parse(rpc.req.Buffer.toString("utf8"));

    switch (MessageType) {
      case "HasNewBlocksMessage":
        this.onHasNewBlocksMessage(FromAddress, payload);
        break;
      case "HasNewBlocksResponse":
        this.onHasNewBlocksResponse(FromAddress, payload);
        break;
      case "SendNewBlocks":
        this.onSendNewBlocks(FromAddress, payload);
        break;
      case "SendNewBlocksResponse":
        this.onSendNewBlocksResponse(FromAddress, payload);
        break;
    }
  }

  async onHasNewBlocksMessage(FromAddress: string, payload: any) {
    // Ignore my own messages
    if (FromAddress === this.nodeName) return;

    const hasNewBlocks = await this.blockStorage.hasNewBlocks(payload.blockId);

    this.gossip.unicastMessage({
      Recipient: FromAddress,
      BroadcastGroup: "blockStorage",
      MessageType: "HasNewBlocksResponse",
      Buffer: new Buffer(JSON.stringify({ hasNewBlocks })),
      Immediate: true,
    });
  }

  async onHasNewBlocksResponse(FromAddress: string, payload: any) {
    if (!payload.hasNewBlocks && this.sync.isSyncingWith(FromAddress)) {
      this.sync.off();
      logger.info(`Block storage ${this.nodeName} stopped syncing with node`, { peer: FromAddress });
      return;
    }

    if (payload.hasNewBlocks) {
      logger.info(`Block storage ${this.nodeName} has a peer with more blocks`, { peer: FromAddress });
    }

    if (payload.hasNewBlocks && !this.isSyncing()) {
      this.sync.on(FromAddress);
      logger.info(`Block storage ${this.nodeName} starts to sync with node`, { peer: FromAddress });

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

  async onSendNewBlocks(FromAddress: string, payload: any) {
    logger.info(`Block storage ${this.nodeName} received request for new blocks from ${FromAddress}`);

    const blocks = await this.blockStorage.getBlocks(payload.blockId);

    blocks.forEach(async (block) => {
      this.gossip.unicastMessage({
        Recipient: FromAddress,
        BroadcastGroup: "blockStorage",
        MessageType: "SendNewBlocksResponse",
        Buffer: new Buffer(JSON.stringify({ block })),
        Immediate: true,
      });
    });
  }

  async onSendNewBlocksResponse(FromAddress: string, payload: any) {
    logger.info(`Block storage ${this.nodeName} received a new block via sync`);

    if (!this.isSyncing()) {
      logger.error(`Block storaged ${this.nodeName} dropped new block received via sync because it is not syncing right now`);
      return;
    }

    if (!this.sync.isSyncingWith(FromAddress)) {
      logger.info(`Block storaged ${this.nodeName} dropped new block received via sync because it came from ${FromAddress} instead of ${this.sync.getNode()}`);
      return;
    }

    this.sync.onReceiveBlock(payload.block);
  }

  public isSyncing(): boolean {
    return this.sync.isSyncing();
  }
}
