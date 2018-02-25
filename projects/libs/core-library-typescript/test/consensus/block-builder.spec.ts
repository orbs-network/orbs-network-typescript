import { types } from "../../src/common-library/types";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

const transactionPool = stubInterface<types.TransactionPoolClient>();
const virtualMachine = stubInterface<types.VirtualMachineClient>();

function randomUInt() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function aRandomTransaction(): types.Transaction {
    return {
        version: 1,
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

function aRandomStateDiff(): types.modifiedStateKey[] {
  return [
    {
      contractAddress: randomUInt().toString(16),
      key: `key-${randomUInt()}`,
      value: randomUInt().toString(),
    }
  ];
}

const dummyTransactionSet = aDummyTransactionSet();

const pullAllPendingTransactionsOutput: types.PullAllPendingTransactionsOutput = { transactions: dummyTransactionSet };
transactionPool.pullAllPendingTransactions.returns(pullAllPendingTransactionsOutput);

const processTransactionSetOutput: types.ProcessTransactionSetOutput = {
  processedTransactions: dummyTransactionSet,
  stateDiff: aRandomStateDiff()
};
virtualMachine.processTransactionSet.returns(processTransactionSetOutput);

const blockBuilder = new BlockBuilder({ virtualMachine, transactionPool });

describe("a block", () => {
  it("is built with the transactions on transaction pool", async () => {
    const block = await blockBuilder.buildNextBlock(1);

    block.transactions.should.eql(dummyTransactionSet);

  });

  it("is built with the transaction on transaction pool", async () => {
    const block = await blockBuilder.buildNextBlock(2);

    block.transactions.should.eql(dummyTransactionSet);

    block.stateDiff.should.eql(processTransactionSetOutput.stateDiff);
  });

});
