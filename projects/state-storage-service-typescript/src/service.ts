import { logger, topology, grpc, topologyPeers, types } from "orbs-common-library";
import bind from "bind-decorator";
import MemoryKVStore from "./kvstore/memory-kvstore";
import * as _ from "lodash";

export default class StateStorageService {

  peers: types.ClientMap;

  kvstore = new MemoryKVStore();

  lastBlockId = 0;

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.info(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async readKeys(rpc: types.ReadKeysContext) {
    logger.info(`${topology.name}: readKeys ${rpc.req.address}/${rpc.req.keys}`);

    // TODO: wait until last block keys are processed
    await this.waitForBlockState(rpc.req.lastBlockId);

    const values = await this.kvstore.getMany(rpc.req.address, rpc.req.keys);

    rpc.res = {values: _.fromPairs([...values])};
  }

  async waitForBlockState(blockId: number, timeout = 5000) {
      return new Promise((resolve, reject) => {
          if (blockId < this.lastBlockId)
              reject(new Error(`attempt to read old state (${blockId} != ${this.lastBlockId})`));

          if (blockId > this.lastBlockId) {
              if (timeout < 200) {
                  reject(new Error(`timeout in attempt to read block state (${blockId} != ${this.lastBlockId})`));
              } else {
                  setTimeout(() => this.waitForBlockState(blockId, timeout - 200), 200);
              }
          }
          resolve();
      });
  }

    // service logic
  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.info(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  async pollBlockStorage() {
    const {blocks} = await this.peers.blockStorage.getBlocks({lastBlockId: this.lastBlockId});

    // assuming an ordered list of blocks
    for (const block of blocks) {
        await this.processNextBlock(block);
    }

    setTimeout(() => this.pollBlockStorage(), 200);
  }

  async processNextBlock(block: types.Block) {
    if (block.prevBlockId == this.lastBlockId) {
        const modifiedArgs = new Map<string, string>(_.toPairs(JSON.parse(block.modifiedAddressesJson)));
        await this.kvstore.setMany(block.tx.contractAddress, modifiedArgs);
        this.lastBlockId = block.id;
    } else {
        throw new Error("block unexpected. out of sync?");
    }
  }

  askForHeartbeats() {
    // this.askForHeartbeat(this.peers.blockStorage);
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    setInterval(() => this.askForHeartbeats(), 5000);
    this.pollBlockStorage();
  }

  constructor() {
    logger.info(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
  }
}
