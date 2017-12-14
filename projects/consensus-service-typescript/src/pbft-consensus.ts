import { types, topology, topologyPeers, QuorumVerifier, CryptoUtils } from "orbs-common-library";


const crypto = new CryptoUtils(undefined, undefined);

export default class PbftConsensus {
  private leader: string = undefined;
  private gossip = topologyPeers(topology.peers).gossip;
  private pendingTransactions: Map<number, [QuorumVerifier, QuorumVerifier]> = new Map();
  private highestSlotNumber = 0;

  async proposeChange(tx: types.Transaction): Promise<void> {
    const leader = await this.getLeader();
    if (leader !== crypto.whoAmI()) {
      // I am not the leader
      this.gossip.unicastMessage({
        Recipient: leader,
        BroadcastGroup: "consensus",
        MessageType: "Transaction",
        Buffer: new Buffer(JSON.stringify(tx)),
        Immediate: true});
    }
    else {
      // I am the leader
      const slotNumber = ++this.highestSlotNumber;
      this.initPending(slotNumber);
      this.gossip.broadcastMessage({
        BroadcastGroup: "consensus",
        MessageType: "PbftPrepare",
        Buffer: new Buffer(JSON.stringify(this.createPrepare(slotNumber, tx, "00000000"))),
        Immediate: true
      }); // pre-prepare

    }
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    console.log("Handling", messageType);
    switch (messageType) {
      case "Transaction": {
        return await this.proposeChange(<types.Transaction>message);
      }
      case "PbftPrepare": {
        return await this.onPrepare(fromAddress, <types.PbftPrepare>message);
      }
      case "PbftCommit": {
        return await this.onCommit(fromAddress, <types.PbftCommit>message);
      }
    //   case "PbftViewChange": {
    //     this.emit("viewChange", fromAddress, <types.PbftViewChange>message);
    //     break;
    //   }
    //   case "PbftNewView": {
    //     this.emit("newView", fromAddress, <types.PbftNewView>message);
    //     break;
    //   }
    }
  }

  private createPrepare(slotNumber: number, tx: types.Transaction, txHash: string): types.PbftPrepare {
    const signer: string = crypto.whoAmI();
    const verificationString: string = `prepare:${slotNumber},${txHash}`;
    const signature: string = crypto.sign(verificationString);
    this.pendingTransactions.get(slotNumber)[0].verify(verificationString, signer, signature);
    return {slotNumber, tx, txHash, signer, signature};
  }

  private createCommit(slotNumber: number, txHash: string): types.PbftCommit {
    const signer: string = crypto.whoAmI();
    const verificationString: string = `commit:${slotNumber}`;
    const signature: string = crypto.sign(verificationString);
    this.pendingTransactions.get(slotNumber)[1].verify(verificationString, signer, signature);
    return {slotNumber, signer, signature};
  }

  private initPending(slotNumber: number) {
    if (! this.pendingTransactions.has(slotNumber)) {
      this.pendingTransactions.set(slotNumber,
        [
          crypto.quorumVerifier(2.0 / 3.0, 1, 5000),
          crypto.quorumVerifier(2.0 / 3.0, 1, 10000)
        ]);
    }
  }

  private async onPrepare(fromAddress: string, message: types.PbftPrepare) {
    this.initPending(message.slotNumber);

    const qv = this.pendingTransactions.get(message.slotNumber)[0];
    qv.verify(`prepare:${message.slotNumber},${message.txHash}`, message.signer, message.signature);
    if (message.signer === await this.getLeader()) {
      // if the message is sent by the leader (pre-prepare), verify the transaction
      // ...

      // broadcast prepare
      this.gossip.broadcastMessage({
        BroadcastGroup: "consensus",
        MessageType: "PbftPrepare",
        Buffer: new Buffer(JSON.stringify(this.createPrepare(message.slotNumber, message.tx, message.txHash))),
        Immediate: true});
    }

    // wait for others' verifications
    if (await qv.awaitFirst()) {
      // Got sufficient quorum; broadcast commit
      this.gossip.broadcastMessage({
        BroadcastGroup: "consensus",
        MessageType: "PbftCommit",
        Buffer: new Buffer(JSON.stringify(this.createCommit(message.slotNumber, message.txHash))),
        Immediate: true
      });
    }
  }

  private async onCommit(fromAddress: string, message: types.PbftCommit) {
    const qv = this.pendingTransactions.get(message.slotNumber)[1];
    await qv.verify(`commit:${message.slotNumber}`, message.signer, message.signature);
    console.log("Writing transaction to log: ", message);
  }

  private async getLeader(): Promise<string> {
    return "node1";
  }

}
