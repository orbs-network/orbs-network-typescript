import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import { TransactionPool } from "../../src/transaction-pool";

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

const gossip = stubInterface<types.GossipClient>();

function aTransaction() {
  const transaction: types.Transaction = {
    version: 0,
    sender: "sender",
    contractAddress: "address",
    signature: "signature",
    payload: "payload"
  };

  return transaction;
}

describe("new broadcast transaction", () => {
  let transactionPool;

  beforeEach(() => {
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
});
