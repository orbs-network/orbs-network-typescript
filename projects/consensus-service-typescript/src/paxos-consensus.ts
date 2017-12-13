import { types, topology, topologyPeers } from "orbs-common-library";
import { EventEmitter } from 'typed-event-emitter';

const PROPOSITION_REJECTED: number = 100;
let nextSlot = 0;

function encodeObject(obj: any): Buffer {
  return new Buffer(JSON.stringify(obj));
}

class CoordinatorPendingSlot {
  transaction: types.Transaction;
  resolve: (val: any) => any;
  reject: (err: any) => any;

  constructor(tx: types.Transaction, resolve: (val: any) => any, reject: (err: any) => any) {
    this.transaction = tx;
    this.resolve = resolve;
    this.reject = reject;
  }
}

class Coordinator {

  highestBallotNumber = 0;
  pendingSlots = new Map<number, CoordinatorPendingSlot>();
  consensus: PaxosConsensus;

  constructor(consensus: PaxosConsensus) {
    this.consensus = consensus;
  }

  onPaxosProposeBroadcast(sender: string, propose: types.PaxosPropose) {
    nextSlot = Math.max(nextSlot, propose.slotNumber + 1);
    if (propose.slotNumber in this.pendingSlots) {
      const proposition = this.pendingSlots.get(propose.slotNumber);
      this.pendingSlots.delete(propose.slotNumber);

      if (proposition.transaction == propose.tx) {
        proposition.resolve(propose.slotNumber);
      }
      else {
        proposition.reject(PROPOSITION_REJECTED);
      }
    }
  }

  async propose(slotNumber: number, tx: types.Transaction) {
    const proposedBallotNumber = ++this.highestBallotNumber;
    console.log("Proposed", proposedBallotNumber);
    await new Promise(
      (resolve, reject) => {
        this.pendingSlots.set(slotNumber, new CoordinatorPendingSlot(tx, resolve, reject));
        this.consensus.gossip.broadcastMessage({BroadcastGroup: "consensus", MessageType: "PaxosPrepare", Buffer: encodeObject({slotNumber: slotNumber, ballotNumber: proposedBallotNumber}), Immediate: false});
      }
    );
  }
}

class Voter {

  consensus: PaxosConsensus;
  ballotMax = 0;
  committed: Map<number, number> = new Map();

  constructor(consensus: PaxosConsensus) {
    this.consensus = consensus;
    this.consensus.onPrepare(this.onPrepare);

  }

  onPrepare(fromAddress: string, prepare: types.PaxosPrepare) {
    if (! this.committed.has(prepare.slotNumber)) {
      this.ballotMax = Math.max(prepare.ballotNumber, this.ballotMax);
      this.committed.set(prepare.slotNumber, this.ballotMax);
    }
    this.consensus.gossip.unicastMessage({
      Recipient: fromAddress,
      BroadcastGroup: "consensus",
      MessageType: "PaxosPrepareAck",
      Buffer: encodeObject({MaxBallot: this.committed.get(prepare.slotNumber)}), Immediate: true})
  }
}


export default class PaxosConsensus extends EventEmitter {
  gossip: types.GossipClient;
  coordinator: Coordinator;
  voter: Voter;

  onPrepare = this.registerEvent<(fromAddress: string, msg: types.PaxosPrepare) => void>();

  constructor() {
    super();
    this.gossip = topologyPeers(topology.peers).gossip;
    this.coordinator = new Coordinator(this);
    this.voter = new Voter(this);
  }

  gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    if (messageType === "PaxosPrepare") {
      this.emit(this.onPrepare, fromAddress, <types.PaxosPrepare>message);
    }
  }

  async sendTransaction(tx: types.Transaction) {
    while (true) {
      try {
        return await this.coordinator.propose(++nextSlot, tx);
      }
      catch (e) {
        if (e === PROPOSITION_REJECTED) {
          continue;
        }
        throw e;
      }
    }
  }

}
