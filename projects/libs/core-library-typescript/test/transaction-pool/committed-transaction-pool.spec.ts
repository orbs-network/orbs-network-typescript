import { types } from "../../src/common-library/types";
import * as mocha from "mocha";
import * as chai from "chai";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import { PendingTransactionPool, CommittedTransactionPool } from "../../src/transaction-pool";
import { aDummyTransaction } from "../../src/test-kit/transaction-builders";
import { TransactionHelper } from "../../src";
import { TransactionStatus } from "orbs-interfaces";

chai.use(chaiAsPromised);
chai.use(sinonChai);

function addTransactionToCommited(pool: CommittedTransactionPool): string {
  const transaction = new TransactionHelper(aDummyTransaction());
    const txHash = transaction.calculateHash();
    const receipt: types.TransactionReceipt = {
      txHash,
      success: true
    };
    const txid = transaction.calculateTransactionId();
    pool.addCommittedTransactions([receipt]);

    return txid;
}


describe("Committed Transaction Pool", () => {
  let committedTransactionPool: CommittedTransactionPool;

  beforeEach(() => {
    committedTransactionPool = new CommittedTransactionPool();
  });

  it("should not have an uncommitted transaction", () => {
    const transaction = new TransactionHelper(aDummyTransaction());
    const txid = transaction.calculateTransactionId();
    expect(committedTransactionPool.hasTransactionWithId(txid)).to.be.false;
  });

  it("should have a committed transaction", () => {
    const txid = addTransactionToCommited(committedTransactionPool);
    expect(committedTransactionPool.hasTransactionWithId(txid)).to.be.true;
  });

  it("should return a transaction status for a commited transaction", () => {
    const txid = addTransactionToCommited(committedTransactionPool);
    const status = committedTransactionPool.getTransactionStatus(txid);
    expect(status).to.have.property("receipt").that.has.property("success", true);
    expect(status).to.have.property("receipt").that.has.property("txHash");
    expect(status).to.have.property("status", TransactionStatus.COMMITTED);
  });

  it("should not return a transaction status for a non-commited transaction", () => {
    const invalidTransactionId = "123";
    const status = committedTransactionPool.getTransactionStatus(invalidTransactionId);
    expect(status).to.have.property("receipt").that.is.undefined;
    expect(status).to.have.property("status", TransactionStatus.NOT_FOUND);
  });

  it("should not return a transaction status for a non-commited transaction when not empty", () => {
    const invalidTransactionId = "123";
    const txid = addTransactionToCommited(committedTransactionPool);
    const status = committedTransactionPool.getTransactionStatus(invalidTransactionId);
    expect(status).to.have.property("receipt").that.is.undefined;
    expect(status).to.have.property("status", TransactionStatus.NOT_FOUND);
  });


  it("should return the right receipt for a committed transaction", () => {
    const transaction = new TransactionHelper(aDummyTransaction());
    const txHash = transaction.calculateHash();
    const receipt: types.TransactionReceipt = {
      txHash,
      success: true
    };
    const txid = transaction.calculateTransactionId();
    committedTransactionPool.addCommittedTransactions([receipt]);
    expect(committedTransactionPool.getTransactionReceiptWithId(txid)).to.be.eql(receipt);
  });
});
