import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
import { TransactionPoolClient, VirtualMachineClient } from "orbs-interfaces";

chai.use(chaiAsPromised);
chai.use(sinonChai);

function randomUInt() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function aRandomTransaction(): types.Transaction {
    return {
        version: 0,
        sender: randomUInt().toString(16),
        contractAddress:  randomUInt().toString(16),
        payload: Math.random().toString(),
        signature: ""
    };
}

function aDummyTransactionSet(numberOfTransactions = 3) {
  const transactions = [];
  for (let i = 0; i < numberOfTransactions; i++); {
    transactions.push(aRandomTransaction);
  }

  return transactions;
}

function aRandomStateDiff(): types.ModifiedStateKey[] {
  return [
    {
      contractAddress: randomUInt().toString(16),
      key: `key-${randomUInt()}`,
      value: randomUInt().toString(),
    }
  ];
}

const dummyTransactionSet = aDummyTransactionSet();

const pullAllPendingTransactionsOutput: types.GetAllPendingTransactionsOutput = { transactions: dummyTransactionSet };

const processTransactionSetOutput: types.ProcessTransactionSetOutput = {
  processedTransactions: dummyTransactionSet,
  stateDiff: aRandomStateDiff(),
  rejectedTransactions: []
};

const processTransactionSetOutputWithRejectedTransactions: types.ProcessTransactionSetOutput = {
  processedTransactions: dummyTransactionSet.slice(0, 2),
  stateDiff: aRandomStateDiff().slice(0, 2),
  rejectedTransactions: [dummyTransactionSet[2]]
};

const processTransactionSetOutputWithEmptyTransactions: types.ProcessTransactionSetOutput = {
  processedTransactions: [],
  stateDiff: [],
  rejectedTransactions: dummyTransactionSet
};


describe("a block", () => {
  let transactionPool: TransactionPoolClient;
  let virtualMachine: VirtualMachineClient;
  let blockBuilder: BlockBuilder;

  beforeEach(() => {
    transactionPool = stubInterface<types.TransactionPoolClient>();
    virtualMachine = stubInterface<types.VirtualMachineClient>();
    blockBuilder = new BlockBuilder({ virtualMachine, transactionPool });
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
});
