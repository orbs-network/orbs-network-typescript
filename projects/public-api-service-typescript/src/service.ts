import { topology, topologyPeers, types, CryptoUtils } from "orbs-common-library";
import bind from "bind-decorator";

export default class PublicApiService {

  peers: types.ClientMap;

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    console.log(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    console.log(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    // this.askForHeartbeat(this.peers.transactionPool);
    this.askForHeartbeat(this.peers.gossip);
  }

  // async generateRandomTransaction() {
  //   const senderCrypto: CryptoUtils = CryptoUtils.initializeTestCrypto(`user${Math.floor((Math.random() * 10) + 1)}`);
  //   const sender = senderCrypto.getPublicKey();
  //
  //
  //   const recipientCrypto: CryptoUtils = CryptoUtils.initializeTestCrypto(`user${Math.floor((Math.random() * 10) + 1)}`);
  //   const recipient = recipientCrypto.getPublicKey();
  //   const amount = Math.floor((Math.random() * 1000) + 1);
  //   const id = `${Math.floor((Math.random() * 1e9))}${Math.floor((Math.random() * 1e9))}`;
  //   const contractAddress = "0";
  //
  //   const senderBalanceKey = `${sender}-balance`;
  //   const initialSenderBalance = amount + 1;
  //
  //   const argumentsJson: string =  JSON.stringify({recipient, amount, id});
  //   const signature = senderCrypto.sign(`tx:${contractAddress},${argumentsJson}`);
  //   await this.peers.consensus.sendTransaction({
  //     transaction: {sender, contractAddress, argumentsJson, signature},
  //     transactionAppendix: {prefetchAddresses: [sender, recipient]}
  //   });
  // }

  @bind
  async sendTransaction(rpc: types.SendTransactionContext) {
    console.log(`${topology.name}: send transaction ${JSON.stringify(rpc.req)}`);

    await this.peers.consensus.sendTransaction(rpc.req);
  }

  @bind
  async call(rpc: types.CallContext) {
    const {resultJson} = await this.peers.virtualMachine.callContract({
      sender: rpc.req.sender,
      argumentsJson: rpc.req.argumentsJson,
      contractAddress: rpc.req.contractAddress
    });

    console.log(`${topology.name}: called contract with ${JSON.stringify(rpc.req)}. result is: ${resultJson}`);

    rpc.res = {
      resultJson: resultJson
    };
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    setInterval(() => this.askForHeartbeats(), 5000);
    // setInterval(() => this.generateRandomTransaction(), Math.ceil(Math.random() * 30000));
  }

  constructor() {
    console.log(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
    process.on("uncaughtException", (err: Error) => {
      console.error(`${__filename}: Caught exception: ${err}`);
      console.error(err.stack);
    });
    process.on("unhandledRejection", (err: Error) => {
      console.error(`${__filename}: Unhandled rejection: ${err}`);
      console.error(err.stack);
    });

  }

}
