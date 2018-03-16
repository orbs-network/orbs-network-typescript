import { types,  } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
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


describe("a block", () => {
  let blockBuilder: BlockBuilder;
  const newBlockBuildCallback = sinon.spy();
  const dummyTransactionSet = aDummyTransactionSet();
  const dummyStateDiff = aDummyStateDiff();

  before(async () => {

    const pullAllPendingTransactionsOutput: types.GetAllPendingTransactionsOutput = { transactions: dummyTransactionSet };
    const transactionPool = stubInterface<types.TransactionPoolClient>();
    transactionPool.getAllPendingTransactions.returns(pullAllPendingTransactionsOutput);

    const processTransactionSetOutput: types.ProcessTransactionSetOutput = {
      processedTransactions: dummyTransactionSet,
      stateDiff: dummyStateDiff
    };
    const virtualMachine = stubInterface<types.VirtualMachineClient>();
    virtualMachine.processTransactionSet.returns(processTransactionSetOutput);

    const blockStorage = stubInterface<types.BlockStorageClient>();
    blockStorage.getLastBlock.returns({block: aGenesisBlock()});

    blockBuilder = new BlockBuilder({ virtualMachine, transactionPool, blockStorage, newBlockBuildCallback, pollIntervalMs: 10});

    await blockBuilder.initialize();
  });

  it("is built from pending transactions shortly after started", (done) => {
    blockBuilder.start();

    setTimeout(() => {
      expect(newBlockBuildCallback).to.have.been.calledWith(sinon.match.has("body",
      sinon.match.has("transactions", dummyTransactionSet).and(sinon.match.has("stateDiff", dummyStateDiff))));
      done();
      blockBuilder.stop();
    }, 100);
  });

  after(async () => {
    blockBuilder.shutdown();
  });
});
