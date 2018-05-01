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
import { RaftConsensus, RaftConsensusConfig } from "../../src/consensus/raft-consensus";
import { FakeGossipClient, generateServiceIPCClient, BlockUtils, Address, JsonBuffer, logger } from "../../src";
import { delay } from "bluebird";

chai.use(sinonChai);

logger.configure({
  level: "DEBUG"
});

function aGenesisBlock(): types.Block {
  return BlockUtils.buildBlock({
    header: {
      version: 0,
      prevBlockHash: new Buffer(""),
      height: 0
    },
    body: {
      transactions: [],
      transactionReceipts: [],
      stateDiff: []
    }
  });
}

function aDummyStateDiff(): types.ModifiedStateKey[] {
  return [
    {
      contractAddress: Address.createContractAddress("dummyContract").toBuffer(),
      key: "dummyKey",
      value: "dummyValue",
    }
  ];
}

function createRaftConsensus(index: number): [types.ConsensusClient, RaftConsensus, FakeGossipClient] {
  const raftConfig: RaftConsensusConfig = {
    clusterSize: 3,
    electionTimeout: { min: 10, max: 20},
    heartbeatInterval: 5,
    nodeName: `node${index}`
  };

  const fakeGossip = new FakeGossipClient(`node${index}`);
  const consensus = new RaftConsensus(raftConfig, fakeGossip, undefined, undefined, undefined);

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
    fakeGossip
  ];
}

describe.only("Raft consensus", () => {
  it("always picks the first block from the two blocks of the same height", async () => {
    const fakeGossip = new FakeGossipClient("node1");
    const [ client1, raft1, gossip1 ] = createRaftConsensus(1);
    const [ client2, raft2, gossip2 ] = createRaftConsensus(2);
    const [ client3, raft3, gossip3] = createRaftConsensus(3);

    gossip1.addNode("node1", { consensus: client1 } );
    gossip1.addNode("node2", { consensus: client2 } );
    gossip1.addNode("node3", { consensus: client3 } );

    gossip2.addNode("node1", { consensus: client1 } );
    gossip2.addNode("node2", { consensus: client2 } );
    gossip2.addNode("node3", { consensus: client3 } );

    gossip3.addNode("node1", { consensus: client1 } );
    gossip3.addNode("node2", { consensus: client2 } );
    gossip3.addNode("node3", { consensus: client3 } );

    await delay(1500);

    return Promise.reject(new Error("NOT IMPLEMENTED"));
  });
});
