import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";

chai.use(chaiAsPromised);
chai.use(sinonChai);

const transactionPool = stubInterface<types.TransactionPoolClient>();
const virtualMachine = stubInterface<types.VirtualMachineClient>();

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


const blockBuilder = new BlockBuilder({ virtualMachine, transactionPool });

describe.only("a block", () => {
  it("contains transactions from the pool", async () => {
    transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);
    virtualMachine.processTransactionSet.returns(processTransactionSetOutput);

    const block = await blockBuilder.buildNextBlock(1);
    expect(block.transactions).to.eql(dummyTransactionSet);
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

  it("throws an error if none of the transactions passed", (done) => {
    transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);
    virtualMachine.processTransactionSet.returns(processTransactionSetOutputWithEmptyTransactions);

    expect(blockBuilder.buildNextBlock(4)).to.eventually.be.rejectedWith("None of the transactions processed successfully. not building a new block").and.notify(done);
  });
});
