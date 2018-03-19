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
        sequenceNumber: 0
      },
      body: {
        contractAddress: {address: "dummyContract"},
        payload: Math.random().toString(),
      }
  };
}

function aDummyTransactionSet(numberOfTransactions = 3) {
  const transactions = [];
  for (let i = 0; i < numberOfTransactions; i++) {
    transactions.push(aDummyTransaction(`address${i}`));
  }

  return transactions;
}

function aDummyStateDiff() {
  return [
    {
      contractAddress: {address: "dummyContract"},
      key: "dummyKey",
      value: "dummyValue",
    }
  ];
}

const dummyTransactionSet = aDummyTransactionSet();

const pullAllPendingTransactionsOutput: types.GetAllPendingTransactionsOutput = { transactions: dummyTransactionSet };

const processTransactionSetOutput: types.ProcessTransactionSetOutput = {
  processedTransactions: dummyTransactionSet,
  stateDiff: aDummyStateDiff(),
  rejectedTransactions: []
};

const processTransactionSetOutputWithRejectedTransactions: types.ProcessTransactionSetOutput = {
  processedTransactions: dummyTransactionSet.slice(0, 2),
  stateDiff: aDummyStateDiff().slice(0, 2),
  rejectedTransactions: [dummyTransactionSet[2]]
};

const processTransactionSetOutputWithEmptyTransactions: types.ProcessTransactionSetOutput = {
  processedTransactions: [],
  stateDiff: [],
  rejectedTransactions: dummyTransactionSet
};


describe.skip("a block", () => {
  let transactionPool: TransactionPoolClient;
  let virtualMachine: VirtualMachineClient;
  let blockBuilder: BlockBuilder;
  let blockStorage: BlockStorageClient;
  let newBlockBuildCallback;

  beforeEach(async () => {
    transactionPool = stubInterface<types.TransactionPoolClient>();
    virtualMachine = stubInterface<types.VirtualMachineClient>();

    blockStorage = stubInterface<types.BlockStorageClient>();
    blockStorage.getLastBlock.returns({block: aGenesisBlock()});

    newBlockBuildCallback = sinon.spy();

    blockBuilder = new BlockBuilder({ virtualMachine, transactionPool, blockStorage, newBlockBuildCallback, pollIntervalMs: 10});
  });

  it("contains transactions from the pool", async () => {
    transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);
    virtualMachine.processTransactionSet.returns(processTransactionSetOutput);

    const block = await blockBuilder.buildNextBlock(1);
    expect(block.transactions).to.eql(dummyTransactionSet);
    expect(transactionPool.clearPendingTransactions).not.to.be.called;
  });

  it("contains a state diff", async () => {
    transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);
    virtualMachine.processTransactionSet.returns(processTransactionSetOutput);

    const block = await blockBuilder.buildNextBlock(2);

    expect(block.transactions).to.eql(dummyTransactionSet);
    expect(block.stateDiff).to.eql(processTransactionSetOutput.stateDiff);
  });

  it("does not contain rejected transactions", async () => {
    transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);
    virtualMachine.processTransactionSet.returns(processTransactionSetOutputWithRejectedTransactions);

    const block = await blockBuilder.buildNextBlock(3);

    expect(block.transactions).to.eql(dummyTransactionSet.slice(0, 2));
    expect(block.stateDiff).to.eql(processTransactionSetOutputWithRejectedTransactions.stateDiff.slice(0, 2));
  });

  it("calls transaction pool to clear rejected transactions from the pool", async () => {
    transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);
    virtualMachine.processTransactionSet.returns(processTransactionSetOutputWithRejectedTransactions);

    const block = await blockBuilder.buildNextBlock(4);

    expect(transactionPool.clearPendingTransactions).to.be.calledOnce;
  });

  it("throws an error if none of the transactions passed", (done) => {
    transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);
    virtualMachine.processTransactionSet.returns(processTransactionSetOutputWithEmptyTransactions);

    expect(blockBuilder.buildNextBlock(5)).to.eventually.be.rejectedWith("None of the transactions processed successfully. Not building a new block").and.notify(done);
  });

  describe("block builder polling", () => {
    let newBlockBuildCallback;

    beforeEach(async () => {
      await blockBuilder.initialize();
    });

    it("is built from pending transactions shortly after started", (done) => {
      transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);
      virtualMachine.processTransactionSet.returns(processTransactionSetOutput);

      blockBuilder.start();

      setTimeout(() => {
        expect(newBlockBuildCallback).to.have.been.calledWith(sinon.match.has("body",
        sinon.match.has("transactions", dummyTransactionSet).and(sinon.match.has("stateDiff", dummyStateDiff))));
        done();
        blockBuilder.stop();
      }, 100);
    });

    after(async () => {
      await blockBuilder.shutdown();
    });
  });

});
