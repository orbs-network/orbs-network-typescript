import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import { PendingTransactionPool, CommittedTransactionPool } from "../../src/transaction-pool";

chai.use(chaiAsPromised);
chai.use(sinonChai);


function aValidTransaction() {
  const transaction: types.Transaction = {
    header: {
      version: 0,
      sender: {id: new Buffer("sender"), scheme: 0, networkId: 0, checksum: 0},
      timestamp: Date.now().toString()
    },
    body: {
      contractAddress: {address: "address"},
      payload: "payload"
    }
  };

  return transaction;
}

function anExpiredTransaction() {
  const transaction: types.Transaction = {
    header: {
      version: 0,
      sender: {id: new Buffer("sender"), scheme: 0, networkId: 0, checksum: 0},
      timestamp: (Date.now() - 60 * 1000 * 10).toString() // of 10 minutes ago
    },
    body: {
      contractAddress: {address: "address"},
      payload: "payload"
    }
  };

  return transaction;
}

describe("Transaction Pool", () => {
  let gossip: types.GossipClient;
  let transactionPool: PendingTransactionPool;

  beforeEach(() => {
    gossip = stubInterface<types.GossipClient>();
    const committedTransactionPool = stubInterface<CommittedTransactionPool>();
    committedTransactionPool.hasTransactionWithId.returns(false);
    transactionPool = new PendingTransactionPool(gossip, committedTransactionPool, { transactionLifespanMs: 30000, cleanupIntervalMs: 1000 });
  });

  it("new broadcast transaction is added to the pool", async () => {
    const tx = aValidTransaction();
    await transactionPool.addNewPendingTransaction(tx);
    const transactionEntries = await transactionPool.getAllPendingTransactions();
    expect(transactionEntries).to.have.lengthOf(1);
    expect(transactionEntries[0].transaction).eql(tx);
    expect(gossip.broadcastMessage).to.have.been.called;
  });

  it("two identical transaction are processed only once", async () => {
    const tx = aValidTransaction();
    const txid = await transactionPool.addNewPendingTransaction(tx);
    await expect(transactionPool.addNewPendingTransaction(tx)).to.eventually.be.rejectedWith(
      `transaction with id ${txid} already exists in the transaction pool`
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
      console.log("transactionPool.transactionLifespanMs", transactionPool.transactionLifespanMs);
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
});
