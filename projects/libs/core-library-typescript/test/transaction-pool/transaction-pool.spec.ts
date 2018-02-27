import { types } from "../../src/common-library/types";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import { TransactionPool } from "../../src/transaction-pool";

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

const transactionPool = new TransactionPool();


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
      transactionPool.gossipMessageReceived("", "newTransaction", {transaction: tx});
      const { transactions } = await transactionPool.pullAllPendingTransactions();
      transactions.should.eql([tx]);
  });
});
