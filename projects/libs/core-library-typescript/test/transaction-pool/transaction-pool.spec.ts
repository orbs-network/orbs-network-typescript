import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import { TransactionPool } from "../../src/transaction-pool";
import { GossipClient } from "orbs-interfaces";

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

function aTransaction() {
  const transaction: types.Transaction = {
    header: {
      version: 0,
      sender: {id: new Buffer("sender"), scheme: 0, networkId: 0, checksum: 0},
      sequenceNumber: 0
    },
    body: {
      contractAddress: {address: "address"},
      payload: "payload"
    }
  };

  return transaction;
}

describe("new broadcast transaction", () => {
  let transactionPool: TransactionPool;
  let gossip: GossipClient;

  beforeEach(() => {
    gossip = stubInterface<types.GossipClient>();
    transactionPool = new TransactionPool(gossip);
  });

  it("is added to the transaction pool", async () => {
    const tx = aTransaction();
    await transactionPool.addNewPendingTransaction(tx);

    const { transactions } = await transactionPool.getAllPendingTransactions();

    transactions.should.eql([tx]);
    expect(gossip.broadcastMessage).to.have.been.called;
  });

  it("two identical transaction are processed only once", async () => {
    const tx = aTransaction();
    await transactionPool.addNewPendingTransaction(tx);

    expect(transactionPool.addNewPendingTransaction(tx)).to.eventually.be.rejectedWith("Transaction with hash 4dadf2569cefcb0b30c5e02bbf2ab226b0a2f564c6d14f488688e3468254ec43 already exists in the pool");
  });

  it("should propagate rejected transactions", async () => {
    const tx = aTransaction();
    await transactionPool.addNewPendingTransaction(tx);

    expect(gossip.broadcastMessage).to.have.been.calledOnce;

    await transactionPool.clearPendingTransactions([tx]);

    expect(gossip.broadcastMessage).to.have.been.calledTwice;
  });

  it("should clear pending transaction upon receiveing gossip message", async () => {
    const tx = aTransaction();
    await transactionPool.addNewPendingTransaction(tx);

    const transactionsBefore = (await transactionPool.getAllPendingTransactions()).transactions;
    expect(transactionsBefore).to.be.eql([tx]);

    await transactionPool.gossipMessageReceived("someNode", "clearPendingTransaction", { transaction: tx });

    const transactionsAfter = (await transactionPool.getAllPendingTransactions()).transactions;
    expect(transactionsAfter).to.be.empty;
  });
});
