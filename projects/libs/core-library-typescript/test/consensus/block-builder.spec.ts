import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
import { TransactionPoolClient, VirtualMachineClient, BlockStorageClient } from "orbs-interfaces";
import { BlockUtils } from "../../src/common-library";
import * as sinon from "sinon";

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

function aDummyTransaction(addressId): types.Transaction {
  const senderAddress: types.UniversalAddress = {
    id: new Buffer(addressId),
    scheme: 0,
    checksum: 0,
    networkId: 0
  };

  return {
      header: {
        version: 0,
        sender: senderAddress,
        timestamp: Date.now()
      },
      body: {
        contractAddress: {address: "dummyContract"},
        payload: Math.random().toString(),
      }
  };
}

function aDummyTransactionSet(numberOfTransactions = 3): types.Transaction[] {
  const transactions: types.Transaction[] = [];
  for (let i = 0; i < numberOfTransactions; i++) {
    const transaction = aDummyTransaction(`address${i}`);
    const txHash = new Buffer(`dummyHash${i}`);
    transactions.push(transaction);
  }

  return transactions;
}

function aDummyStateDiff(): types.ModifiedStateKey[] {
  return [
    {
      contractAddress: {address: "dummyContract"},
      key: "dummyKey",
      value: "dummyValue",
    }
  ];
}


describe("a block", () => {
  let blockBuilder: BlockBuilder;
  let newBlockBuildCallback;

  const dummyTransactionSet = aDummyTransactionSet();
  const dummyStateDiff = aDummyStateDiff();
  const dummyTransactionReceipts = [{ txHash: new Buffer("dummyhash"), success: true }];

  beforeEach(async () => {
    const blockStorage: BlockStorageClient = stubInterface<types.BlockStorageClient>();
    blockStorage.getLastBlock.returns({block: aGenesisBlock()});

    newBlockBuildCallback = sinon.spy();

    const transactionEntries: types.TransactionEntry[] = dummyTransactionSet.map(transaction => ({ transaction, txHash: new Buffer("dummyHash")}));
    const pullAllPendingTransactionsOutput: types.GetAllPendingTransactionsOutput = { transactionEntries };
    const transactionPool = stubInterface<types.TransactionPoolClient>();
    transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);


    const processTransactionSetOutput: types.ProcessTransactionSetOutput = {
      stateDiff: dummyStateDiff,
      transactionReceipts: dummyTransactionReceipts
    };

    const virtualMachine = stubInterface<types.VirtualMachineClient>();
    virtualMachine.processTransactionSet.returns(processTransactionSetOutput);

    blockBuilder = new BlockBuilder({ virtualMachine, transactionPool, blockStorage, newBlockBuildCallback, pollIntervalMs: 10});

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

    after(async () => {
      await blockBuilder.shutdown();
    });
  });

});
