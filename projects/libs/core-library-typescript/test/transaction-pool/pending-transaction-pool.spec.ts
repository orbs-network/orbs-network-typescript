import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import { PendingTransactionPool } from "../../src/transaction-pool";
import { aDummyTransaction } from "../../src/test-kit/transaction-builders";
import { TransactionHelper } from "../../src";

chai.use(chaiAsPromised);
chai.use(sinonChai);


function aValidTransaction() {
  return aDummyTransaction();
}

function anExpiredTransaction() {
  return aDummyTransaction({ timestamp: Date.now() - 60 * 1000 * 10 });
}

describe("Transaction Pool", () => {
  let gossip: types.GossipClient;
  let transactionPool: PendingTransactionPool;

  beforeEach(() => {
    gossip = stubInterface<types.GossipClient>();
    transactionPool = new PendingTransactionPool(gossip, { transactionLifespanMs: 30000, cleanupIntervalMs: 1000 });
  });

  it("transaction that is added can be found in the pool", async () => {
    const tx = aValidTransaction();
    const txid = await transactionPool.addNewPendingTransaction(tx);
    const inPool = transactionPool.hasTransactionWithId(txid);
    expect(inPool).to.be.true;
  });

  it("transaction that is not added can not be found in the pool", async () => {
    const inPool = transactionPool.hasTransactionWithId("should-not-be-found");
    expect(inPool).to.be.false;
  });

  it("new broadcast transaction is added to the pool", async () => {
    const tx = aValidTransaction();
    await transactionPool.addNewPendingTransaction(tx);
    const transactionEntries = await transactionPool.getAllPendingTransactions();
    expect(transactionEntries).to.have.lengthOf(1);
    expect(transactionEntries[0].transaction).eql(tx);
    expect(gossip.broadcastMessage).to.have.been.called;
  });

  it("two identical transactions are processed only once", async () => {
    const tx = aValidTransaction();
    const txid = await transactionPool.addNewPendingTransaction(tx);
    await expect(transactionPool.addNewPendingTransaction(tx)).to.eventually.be.rejectedWith(
      `Transaction with id ${txid} already exists in the transaction pool`
    );
  });

  it("expired transaction is not added to the pool", async () => {
    const tx = anExpiredTransaction();
    await expect(transactionPool.addNewPendingTransaction(tx)).to.be.rejected;
  });

  describe("expired transaction is properly cleared from the pool when calling clearExpiredTransactions()", () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers(Date.now());
    });

    afterEach(() => {
      clock.restore();
    });

    it("", async () => {
      const tx1 = aValidTransaction();
      await transactionPool.addNewPendingTransaction(tx1);
      clock.tick(60 * 1000 * 10);

      const tx2 = aValidTransaction();
      await transactionPool.addNewPendingTransaction(tx2);
      transactionPool.clearExpiredTransactions();

      const pendingTransactions = transactionPool.getAllPendingTransactions();
      expect(pendingTransactions).to.have.lengthOf(1);
      expect(pendingTransactions[0]).to.have.property("transaction", tx2);
    });
  });

  describe("expired transaction is properly cleared from the pool by the cleanup timer", () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers(Date.now());
    });

    afterEach(() => {
      clock.restore();
    });

    it("", async () => {
      const tx1 = aValidTransaction();
      await transactionPool.addNewPendingTransaction(tx1);
      clock.tick(transactionPool.transactionLifespanMs + 1);

      const tx2 = aValidTransaction();
      await transactionPool.addNewPendingTransaction(tx2);
      transactionPool.startCleanupTimer();

      // this should be smaller than the transaction lifespan to work. Otherwise both transactions will expire
      clock.tick(transactionPool.cleanupIntervalMs + 1);

      transactionPool.stopCleanupTimer();

      const pendingTransactions = transactionPool.getAllPendingTransactions();
      expect(pendingTransactions).to.have.lengthOf(1);
      expect(pendingTransactions[0]).to.have.property("transaction", tx2);
    });
  });

  describe("get status of a transaction", () => {
    it("that is not in the pool", () => {
      const transaction = aValidTransaction();
      const txid = new TransactionHelper(transaction).calculateTransactionId();
      expect(transactionPool.getTransactionStatus(txid)).to.be.eql({
        status: types.TransactionStatus.NOT_FOUND,
        receipt: undefined
      });
    });
    it("that is in the pending pool", () => {
      const transaction = aValidTransaction();
      const txid = new TransactionHelper(transaction).calculateTransactionId();
      transactionPool.addNewPendingTransaction(transaction);
      expect(transactionPool.getTransactionStatus(txid)).to.be.eql({
        status: types.TransactionStatus.PENDING,
        receipt: undefined
      });
    });
  });
});
