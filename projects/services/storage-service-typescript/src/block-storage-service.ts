/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as _ from "lodash";
import * as path from "path";

import { logger, types, JsonBuffer, KeyManager, BlockStorage, BlockStorageSync, Service, ServiceConfig, StartupCheck, StartupStatus } from "orbs-core-library";
import { chunk } from "lodash";

export interface BlockStorageServiceConfig extends ServiceConfig {
  dbPath: string;
  pollInterval: number;
  verifySignature: boolean;
  keyManager?: KeyManager;
  batchSize: number;
  batchesPerInterval: number;
}

export default class BlockStorageService extends Service implements StartupCheck {
  private blockStorage: BlockStorage;
  private sync: BlockStorageSync;
  private gossip: types.GossipClient;
  private transactionPool: types.TransactionPoolClient;
  private pollForNewBlocksInterval: any;
  private pollForNewBlocksIntervalMs: number;

  public constructor(gossip: types.GossipClient, transactionPool: types.TransactionPoolClient, serviceConfig: BlockStorageServiceConfig) {
    super(serviceConfig);
    this.gossip = gossip;
    this.transactionPool = transactionPool;
    this.pollForNewBlocksIntervalMs = serviceConfig.pollInterval;
  }

  async initialize() {
    await this.initBlockStorage();

    this.pollForNewBlocksInterval = setInterval(() => {
      this.pollForNewBlocks();
    }, this.pollForNewBlocksIntervalMs);
  }

  async initBlockStorage(): Promise<void> {
    const blockStorageConfig = <BlockStorageServiceConfig>this.config;
    this.blockStorage = new BlockStorage({
      dbPath: blockStorageConfig.dbPath,
      verifySignature: blockStorageConfig.verifySignature,
      keyManager: blockStorageConfig.keyManager
    }, this.transactionPool);
    await this.blockStorage.load();
    this.sync = new BlockStorageSync(this.blockStorage);
  }

  async shutdown() {
    clearInterval(this.pollForNewBlocksInterval);
    return this.blockStorage.shutdown();
  }

  @Service.RPCMethod
  public async hasNewBlocks(rpc: types.HasNewBlocksContext) {
    return this.blockStorage.hasNewBlocks(rpc.req.blockHeight);
  }

  @Service.RPCMethod
  public async addBlock(rpc: types.AddBlockContext) {
    const block = rpc.req.block;

    logger.info(`Block storage ${this.config.nodeName} is adding new block with height ${block.header.height}`);

    if (this.isSyncing()) {
      this.sync.onReceiveBlock(block);
      await this.sync.appendBlocks();
    } else {
      await this.blockStorage.addBlock(block);
    }

    rpc.res = {};
  }

  @Service.RPCMethod
  public async getLastBlock(rpc: types.GetLastBlockContext) {
    rpc.res = { block: await this.blockStorage.getLastBlock() };
  }

  @Service.RPCMethod
  public async getBlocks(rpc: types.GetBlocksContext) {
    rpc.res = { blocks: await this.blockStorage.getBlocks(rpc.req.lastBlockHeight, rpc.req.limit) };
  }

  async pollForNewBlocks() {
    // TODO: find a better way to do sync timeout
    this.sync.off();

    await this.sync.appendBlocks();

    const block = await this.blockStorage.getLastBlock();

    logger.debug(`Block storage ${this.config.nodeName} is polling for new blocks`, { lastBlockHeight: block.header.height });

    this.gossip.broadcastMessage({
      broadcastGroup: "blockStorage",
      messageType: "HasNewBlocksMessage",
      buffer: new Buffer(JSON.stringify({ blockHeight: block.header.height })),
      immediate: true
    });
  }

  @Service.SilentRPCMethod
  public async gossipMessageReceived(rpc: types.GossipMessageReceivedContext) {
    const { messageType, fromAddress } = rpc.req;
    const payload = JsonBuffer.parseJsonWithBuffers(rpc.req.buffer.toString("utf8"));

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

    const hasNewBlocks = await this.blockStorage.hasNewBlocks(payload.blockHeight);

    this.gossip.unicastMessage({
      recipient: fromAddress,
      broadcastGroup: "blockStorage",
      messageType: "HasNewBlocksResponse",
      buffer: new Buffer(JSON.stringify({ hasNewBlocks })),
      immediate: true,
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

      const blockHeight = (await this.blockStorage.getLastBlock()).header.height;

      this.gossip.unicastMessage({
        recipient: this.sync.getNode(),
        broadcastGroup: "blockStorage",
        messageType: "SendNewBlocks",
        buffer: new Buffer(JSON.stringify({ blockHeight })),
        immediate: true,
      });
    }
  }

  async onSendNewBlocks(fromAddress: string, payload: any) {
    logger.info(`Block storage ${this.config.nodeName} received a request for new blocks from ${fromAddress}`);

    const blockStorageConfig = <BlockStorageServiceConfig>this.config;
    const blocks = await this.blockStorage.getBlocks(payload.blockHeight, blockStorageConfig.batchSize * blockStorageConfig.batchSize);

    const batches = chunk(blocks, blockStorageConfig.batchSize).slice(0, blockStorageConfig.batchesPerInterval);

    logger.info(`Block storage is sending ${batches.length} batches of blocks to ${fromAddress}`);

    batches.forEach(async (blocks) => {
      this.gossip.unicastMessage({
        recipient: fromAddress,
        broadcastGroup: "blockStorage",
        messageType: "SendNewBlocksResponse",
        buffer: new Buffer(JSON.stringify({ blocks })),
        immediate: true,
      });
    });
  }

  async onSendNewBlocksResponse(fromAddress: string, payload: any) {
    logger.info(`Block storage ${this.config.nodeName} received a new batch of blocks via sync`);

    payload.blocks.forEach((block: types.Block) => {
      this.sync.onReceiveBlock(block);
    });
  }

  public isSyncing(): boolean {
    return this.sync.isSyncing();
  }

  public async startupCheck(): Promise<StartupStatus> {
    return this.blockStorage.startupCheck();
  }
}
