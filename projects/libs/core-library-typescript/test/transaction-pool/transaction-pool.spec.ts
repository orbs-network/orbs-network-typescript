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

const transactionPool = new TransactionPool(gossip);


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
  it("is added to the transaction pool", async () => {
    const tx = aTransaction();
    await transactionPool.addNewPendingTransaction(tx);
    const { transactions } = await transactionPool.getAllPendingTransactions();
    transactions.should.eql([tx]);
    expect(gossip.broadcastMessage).to.have.been.called;
  });

  xit("two identical transaction are processed only once");
});
