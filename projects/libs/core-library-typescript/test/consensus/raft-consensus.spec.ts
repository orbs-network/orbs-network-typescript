import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
import { TransactionPoolClient, VirtualMachineClient, BlockStorageClient } from "orbs-interfaces";
import * as sinon from "sinon";
import { createHash } from "crypto";
import { aDummyTransactionSet } from "../../src/test-kit/transaction-builders";
import { RaftConsensus } from "../../src/consensus/raft-consensus";
import { FakeGossipClient, BlockUtils, Address, JsonBuffer, logger, BlockStorage, RaftConsensusConfig } from "../../src";
import { delay } from "bluebird";
import * as _ from "lodash";

chai.use(sinonChai);

logger.configure({
  level: "DEBUG"
});

function createRaftConsensus(index: number): [types.ConsensusClient, RaftConsensus, FakeGossipClient, BlockStorageClient] {
  const raftConfig: RaftConsensusConfig = {
    clusterSize: 3,
    electionTimeout: { min: 10, max: 20},
    heartbeatInterval: 5,
    nodeName: `node${index}`,
    algorithm: "raft"
  };

  const fakeGossip = new FakeGossipClient(`node${index}`);
  const fakeBlockStorage = stubInterface<BlockStorageClient>();
  const consensus = new RaftConsensus(raftConfig, fakeGossip, fakeBlockStorage, undefined, undefined);

  const client: types.ConsensusClient = {
    gossipMessageReceived : (req: types.GossipListenerInput): types.GossipListenerOutput => {
      const payload: any = JsonBuffer.parseJsonWithBuffers(req.buffer.toString("utf8"));
      consensus.onMessageReceived(req.fromAddress, req.messageType, payload);
      return {};
    }
  };

  return [
    client,
    consensus,
    fakeGossip,
    fakeBlockStorage
  ];
}

function generateEmptyBlock(prevBlockHash: Buffer, height: number) {
  const block: types.Block = {
    header: {
      version: 0,
      prevBlockHash,
      height
    },
    body: {
      stateDiff: [],
      transactionReceipts: [],
      transactions: []
    }
  };

  return block;
}

describe("Raft consensus", () => {
  xit("always picks the first block from the two blocks of the same height", async function() {
    this.timeout(20000);

    const fakeGossip = new FakeGossipClient("node1");
    const [ client1, raft1, gossip1, blockStorage1 ] = createRaftConsensus(1);
    const [ client2, raft2, gossip2, blockStorage2 ] = createRaftConsensus(2);
    const [ client3, raft3, gossip3, blockStorage3 ] = createRaftConsensus(3);

    gossip1.addNode("node1", { consensus: client1 } );
    gossip1.addNode("node2", { consensus: client2 } );
    gossip1.addNode("node3", { consensus: client3 } );

    gossip2.addNode("node1", { consensus: client1 } );
    gossip2.addNode("node2", { consensus: client2 } );
    gossip2.addNode("node3", { consensus: client3 } );

    gossip3.addNode("node1", { consensus: client1 } );
    gossip3.addNode("node2", { consensus: client2 } );
    gossip3.addNode("node3", { consensus: client3 } );

    await delay(100);

    console.log("Generating blocks...");

    const blockZero = generateEmptyBlock(new Buffer(""), 0);
    const blockA = generateEmptyBlock(new Buffer(_.repeat("a", 100)), 1);
    const blockB = generateEmptyBlock(new Buffer(_.repeat("b", 1000000)), 2);
    const blockC = generateEmptyBlock(new Buffer(_.repeat("c", 120)), 2);
    const blockD = generateEmptyBlock(new Buffer(_.repeat("d", 100)), 3);

    console.log("Finished generating blocks...");

    const nodes = [ raft1, raft2, raft3 ];
    const blockStorages = [ blockStorage1, blockStorage2, blockStorage2 ];

    const leader = () => _.find(nodes, n => n.isLeader());
    const follower = blockStorages[_.findIndex(nodes, n => !n.isLeader())];

    leader().onNewBlockBuild(blockZero);
    leader().onNewBlockBuild(blockA);
    leader().onNewBlockBuild(blockB);
    leader().onNewBlockBuild(blockC);
    leader().onNewBlockBuild(blockD);

    await delay(15000);

    expect((<sinon.SinonSpy>follower.addBlock).getCall(0).args[0]).to.have.property("block").eql(blockZero);
    expect((<sinon.SinonSpy>follower.addBlock).getCall(1).args[0]).to.have.property("block").eql(blockA);
    expect((<sinon.SinonSpy>follower.addBlock).getCall(2).args[0]).to.have.property("block").eql(blockB);
    expect((<sinon.SinonSpy>follower.addBlock).getCall(3).args[0]).to.have.property("block").eql(blockC);
    expect((<sinon.SinonSpy>follower.addBlock).getCall(4).args[0]).to.have.property("block").eql(blockD);
  });
});
