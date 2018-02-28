import { types } from "../../src/common-library/types";
import * as chai from "chai";
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
        version: 0,
        sender: "sender",
        contractAddress: "address",
        signature: "signature",
        payload: "payload"
    };

    return transaction;
}

describe("new broadcast transaction", () => {
  it("is added to the transaction pool", async () => {
      const tx = aTransaction();
      transactionPool.addNewPendingTransaction(tx);
      const { transactions } = await transactionPool.getAllPendingTransactions();
      transactions.should.eql([tx]);
      gossip.broadcastMessage.should.have.been.called;
  });
});
