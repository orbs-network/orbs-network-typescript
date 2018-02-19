import * as _ from "lodash";

import { logger, types, config } from "orbs-core-library";
import { Service } from "orbs-core-library";
import { BlockStorage, BlockStorageSync } from "orbs-core-library";
import { stringToBuffer } from "orbs-core-library";

export default class BlockStorageService extends Service {
  private blockStorage: BlockStorage;
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
    const obj = JSON.parse(rpc.req.Buffer.toString("utf8"));

    switch (rpc.req.MessageType) {
      case "HasNewBlocksMessage":
        if (rpc.req.FromAddress === this.nodeName) break;

        const hasNewBlocks = await this.blockStorage.hasNewBlocks(obj.blockId);

        if (!hasNewBlocks) break;

        this.gossip.unicastMessage({
          Recipient: rpc.req.FromAddress,
          BroadcastGroup: "blockStorage",
          MessageType: "HasNewBlocksResponse",
          Buffer: new Buffer(JSON.stringify({ hasNewBlocks })),
          Immediate: true,
        });
        break;
      case "HasNewBlocksResponse":
        logger.info(`Block storage has a peer with more blocks`, { peer: rpc.req.FromAddress });

        const blockId = await this.blockStorage.getLastBlockId();

        this.gossip.unicastMessage({
          Recipient: rpc.req.FromAddress,
          BroadcastGroup: "blockStorage",
          MessageType: "SendNewBlocks",
          Buffer: new Buffer(JSON.stringify({ blockId })),
          Immediate: true,
        });
        break;

      case "SendNewBlocks":
        logger.info(`Block storage received request for new blocks from ${rpc.req.FromAddress}`);

        const blocks = await this.blockStorage.getBlocks(obj.blockId);

        blocks.forEach(async (block) => {
          this.gossip.unicastMessage({
            Recipient: rpc.req.FromAddress,
            BroadcastGroup: "blockStorage",
            MessageType: "SendNewBlocksResponse",
            Buffer: new Buffer(JSON.stringify({ block })),
            Immediate: true,
          });
        });
        break;

      case "SendNewBlocksResponse":
        logger.info(`Block storage received a new block via sync`);
        this.sync.onReceiveBlock(obj.block);
      default:
        logger.debug(`Not implemented`, rpc.req);
        break;
    }
  }
}
