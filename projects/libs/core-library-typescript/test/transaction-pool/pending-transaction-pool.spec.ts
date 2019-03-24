/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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
import { TransactionValidator } from "../../src/transaction-pool/transaction-validator";

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
  let transactionValidator: TransactionValidator;

  beforeEach(() => {
    gossip = stubInterface<types.GossipClient>();
    transactionValidator = stubInterface<TransactionValidator>();
    (<sinon.SinonStub>transactionValidator.validate).returns(true);
    transactionPool = new PendingTransactionPool(
      gossip, transactionValidator, {
        transactionLifespanMs: 30000, cleanupIntervalMs: 1000
      });
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

  it("if validator rejects a transactions it's not added the pool and an error is thrown", async () => {
    const tx = aValidTransaction();
    (<sinon.SinonStub>transactionValidator.validate).returns(false);
    expect(transactionPool.addNewPendingTransaction(tx)).to.be.rejected;
    const transactionEntries = await transactionPool.getAllPendingTransactions();
    expect(transactionEntries).to.have.lengthOf(0);
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
    it("that is in the pending pool", async () => {
      const transaction = aValidTransaction();
      const txid = new TransactionHelper(transaction).calculateTransactionId();
      await transactionPool.addNewPendingTransaction(transaction);
      expect(transactionPool.getTransactionStatus(txid)).to.be.eql({
        status: types.TransactionStatus.PENDING,
        receipt: undefined
      });
    });
  });
});
