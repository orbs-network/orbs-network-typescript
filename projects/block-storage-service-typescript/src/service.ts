import { logger, topology, grpc, topologyPeers, types } from "orbs-common-library";
import bind from "bind-decorator";
import * as _ from "lodash";


// TODO: support a head block which refers to a NULL prev block
const DEFAULT_GENESIS_BLOCK: types.Block = {
    id: 0,
    prevBlockId: -1,
    tx: {contractAddress: "0", sender: "", signature: "", argumentsJson: "{}"},
    modifiedAddressesJson: "{}"
};

export default class BlockStorageService {
  peers: types.ClientMap;

  storedBlocks: types.Block[] = [DEFAULT_GENESIS_BLOCK];

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.info(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }


  @bind
  public async addBlock(rpc: types.AddBlockContext) {
      const {block} = rpc.req;
      const lastBlock = this.storedBlocks[this.storedBlocks.length - 1];
      if (block.prevBlockId != lastBlock.id) {
          throw new Error(`expects previous block ID ${lastBlock.id}. retrieved ${block.prevBlockId} / ${block.id}. ${JSON.stringify(this.storedBlocks)}`);
      }

      this.storedBlocks.push(block);
      logger.info("Added new block. stored blocks:", this.storedBlocks);
  }

  @bind
  public async getBlocks(rpc: types.GetBlocksContext) {
      const firstBlockIndex = _.findIndex(this.storedBlocks, {prevBlockId: rpc.req.lastBlockId});

      rpc.res = {blocks: firstBlockIndex == -1 ? [] : this.storedBlocks.slice(firstBlockIndex)};

      // logger.info(`${topology.name}: getBlocks`, rpc.res, this.storedBlocks);

  }

    // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.info(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    /*
    this.askForHeartbeat(this.peers.gossip);
     */
  }


  async main() {
    this.peers = topologyPeers(topology.peers);
    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    logger.info(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
  }
}
