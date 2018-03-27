
import * as chai from "chai";
import { VirtualMachine } from "../../src/virtual-machine";
import { types } from "../../src/common-library";
import * as _ from "lodash";
import * as cap from "chai-as-promised";

chai.should();
chai.use(cap);

class StubStorageClient implements types.StateStorageClient {
  keyMap: { [id: string]: string };
  contractAddress: types.ContractAddress;

  constructor(opts: { contractAddress: types.ContractAddress, keyMap: { [id: string]: string } }) {
    this.contractAddress = opts.contractAddress;
    this.keyMap = opts.keyMap;
  }

  readKeys(input: types.ReadKeysInput): types.ReadKeysOutput {
    if (input.contractAddress.address != this.contractAddress.address) {
      throw new Error(`State storage supports only a single contract ${this.contractAddress} != ${input.contractAddress}`);
    }
    return { values: _.pick(this.keyMap, input.keys) };
  }
}

function aTransaction(builder: { from: string, to: string, amount: number }, contractAddress: string = "foobar"): types.Transaction {
  return {
    header: {
      version: 1,
      sender: {id: new Buffer(builder.from), networkId: 0, scheme: 0, checksum: 0},
      sequenceNumber: 0
    },
    body: {
      contractAddress: {address: contractAddress},
      payload: JSON.stringify({
        method: "transfer",
        args: [builder.to, builder.amount]
      }),
    },
  };
}

describe("test virtual machine", () => {
  let virtualMachine: VirtualMachine;
  let stateStorage: StubStorageClient;

  beforeEach(() => {
    stateStorage = new StubStorageClient({
      contractAddress: {address: "foobar" },
      keyMap: { "balances.account1": "10", "balances.account2": "0" }
    });
    virtualMachine = new VirtualMachine(stateStorage);
  });

  it("rejects a transaction with a non-positive amount", async () => {
    const transaction = aTransaction({ from: "account1", to: "account2", amount: 0 });

    const { processedTransactions, stateDiff, rejectedTransactions } = await virtualMachine.processTransactionSet({
      orderedTransactions: [transaction]
    });

    rejectedTransactions.should.have.lengthOf(1);
    rejectedTransactions.should.contain(transaction);
  });

  it("explodes on an unexpected error", async () => {
    const transaction = aTransaction({ from: "foo", to: "bar", amount: 0 }, "zagzag");

    return chai.expect(virtualMachine.processTransactionSet({ orderedTransactions: [transaction] })).to.be.rejected;
  });

  it("#processTransactionSet - ordered transfers between 3 accounts", async () => {
    const { processedTransactions, stateDiff, rejectedTransactions } = await virtualMachine.processTransactionSet({
      orderedTransactions: [    // account1=10
        aTransaction({ from: "account1", to: "account2", amount: 9 }), // account1 = 1, account2 = 9
        aTransaction({ from: "account2", to: "account1", amount: 2 }), // account1 = 3, account2 = 7
        aTransaction({ from: "account1", to: "account3", amount: 2 })  // account1 = 1, account2 = 7, account3 = 2
      ]
    });
    stateDiff.should.have.lengthOf(3);
    for (const item of stateDiff) {
      item.should.have.property("contractAddress").eql({address: "foobar"});
    }
    stateDiff.find(item => item.key === "balances.account1").should.have.property("value", "1");
    stateDiff.find(item => item.key === "balances.account2").should.have.property("value", "7");
    stateDiff.find(item => item.key === "balances.account3").should.have.property("value", "2");
  });


  it("#processTransactionSet - ordered transfers between 3 accounts (with a failed transaction in between)", async () => {
    const { processedTransactions, stateDiff, rejectedTransactions } = await virtualMachine.processTransactionSet({
      orderedTransactions: [    // account1=10
        aTransaction({ from: "account1", to: "account2", amount: 9 }), // account1 = 1, account2 = 9
        aTransaction({ from: "account2", to: "account1", amount: 2 }), // account1 = 3, account2 = 7
        aTransaction({ from: "account1", to: "account2", amount: 4 }), // account1 = 3, account2 = 7
        aTransaction({ from: "account1", to: "account3", amount: 2 })  // account1 = 1, account2 = 7, account3 = 2
      ]
    });
    stateDiff.should.have.lengthOf(3);
    for (const item of stateDiff) {
      item.should.have.property("contractAddress").eql({address: "foobar"});
    }
    stateDiff.find(item => item.key === "balances.account1").should.have.property("value", "1");
    stateDiff.find(item => item.key === "balances.account2").should.have.property("value", "7");
    stateDiff.find(item => item.key === "balances.account3").should.have.property("value", "2");

    rejectedTransactions.should.have.lengthOf(1);
    rejectedTransactions.should.be.eql([aTransaction({ from: "account1", to: "account2", amount: 4 })]);
  });
});
