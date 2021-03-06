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
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
import { TransactionPoolClient, VirtualMachineClient, BlockStorageClient } from "orbs-interfaces";
import { BlockUtils, TransactionHelper } from "../../src/common-library";
import { Address } from "../../src/common-library/address";
import * as sinon from "sinon";
import { createHash } from "crypto";
import { aDummyTransactionSet } from "../../src/test-kit/transaction-builders";

chai.use(sinonChai);


function aGenesisBlock(): types.Block {
  return BlockUtils.buildBlock({
    header: {
      version: 0,
      prevBlockHash: new Buffer(""),
      height: 0
    },
    body: {
      transactions: [],
      transactionReceipts: [],
      stateDiff: []
    }
  });
}

function aDummyStateDiff(): types.ModifiedStateKey[] {
  return [
    {
      contractAddress: Address.createContractAddress("dummyContract").toBuffer(),
      key: "dummyKey",
      value: "dummyValue",
    }
  ];
}


describe("a block", () => {
  let blockBuilder: BlockBuilder;
  let newBlockBuildCallback: sinon.SinonSpyStatic;

  const dummyTransactionSet = aDummyTransactionSet();
  const dummyStateDiff = aDummyStateDiff();
  const dummyTransactionReceipts: types.TransactionReceipt[] = dummyTransactionSet.map(tx => ({
    txHash: new TransactionHelper(tx).calculateHash (),
    success: true
  }));

  beforeEach(async () => {
    const blockStorage = stubInterface<types.BlockStorageClient>();
    (<sinon.SinonStub>blockStorage.getLastBlock).returns({block: aGenesisBlock()});

    newBlockBuildCallback = sinon.spy();

    const transactionEntries: types.TransactionEntry[] = dummyTransactionSet.map(transaction => (
      { transaction, txHash: new Buffer("dummyHash")
    }));
    const pullAllPendingTransactionsOutput: types.GetAllPendingTransactionsOutput = { transactionEntries };
    const transactionPool = stubInterface<types.TransactionPoolClient>();
    (<sinon.SinonStub>transactionPool.getAllPendingTransactions).returns(pullAllPendingTransactionsOutput);


    const processTransactionSetOutput: types.ProcessTransactionSetOutput = {
      stateDiff: dummyStateDiff,
      transactionReceipts: dummyTransactionReceipts
    };

    const virtualMachine = stubInterface<types.VirtualMachineClient>();
    (<sinon.SinonStub>virtualMachine.processTransactionSet).returns(processTransactionSetOutput);

    blockBuilder = new BlockBuilder(
      { virtualMachine, transactionPool, blockStorage, newBlockBuildCallback,
        config: { pollIntervalMs: 10 }
      });
  });

  describe("block builder polling", () => {
    beforeEach(async () => {
      await blockBuilder.initialize();
    });

    it("is built from pending transactions shortly after started", (done) => {
      blockBuilder.start();

      setTimeout(() => {
        try {
          const bodyMatch = sinon.match.has("transactions", dummyTransactionSet)
          .and(sinon.match.has("stateDiff", dummyStateDiff))
          .and(sinon.match.has("transactionReceipts"));
          expect(newBlockBuildCallback).to.have.been.calledWith(sinon.match.has("body", bodyMatch));
          done();
        } catch (e) {
          done(e);
        } finally {
          blockBuilder.stop();
        }
      }, 100);
    });

    it("restarts successfully after being stopped", (done) => {
      blockBuilder.start();
      blockBuilder.stop();
      blockBuilder.start();

      setTimeout(() => {
        try {
          const bodyMatch = sinon.match.has("transactions", dummyTransactionSet)
          .and(sinon.match.has("stateDiff", dummyStateDiff))
          .and(sinon.match.has("transactionReceipts"));
          expect(newBlockBuildCallback).to.have.been.calledWith(sinon.match.has("body", bodyMatch));
          done();
        } catch (e) {
          done(e);
        } finally {
          blockBuilder.stop();
        }
      }, 100);
    });

    afterEach(async () => {
      await blockBuilder.shutdown();
    });
  });

});
