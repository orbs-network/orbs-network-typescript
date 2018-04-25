import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import { PendingTransactionPool, CommittedTransactionPool } from "../../src/transaction-pool";
import { aDummyTransaction } from "../../src/test-kit/transaction-builders";
import { TransactionHelper } from "../../src";

chai.use(chaiAsPromised);
chai.use(sinonChai);

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
    const transaction = new TransactionHelper(aDummyTransaction());
    const txHash = transaction.calculateHash();
    const receipt: types.TransactionReceipt = {
      txHash,
      success: true
    };
    const txid = transaction.calculateTransactionId();
    committedTransactionPool.addCommittedTransactions([receipt]);
    expect(committedTransactionPool.hasTransactionWithId(txid)).to.be.true;
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
