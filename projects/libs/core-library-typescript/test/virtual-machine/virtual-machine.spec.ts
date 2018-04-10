
import * as chai from "chai";
import { VirtualMachine } from "../../src/virtual-machine";
import { types } from "../../src/common-library";
import * as _ from "lodash";
import * as cap from "chai-as-promised";
import * as cs from "chai-subset";
import * as path from "path";
import HardCodedSmartContractProcessor from "../../src/virtual-machine/hard-coded-contracts/processor";

chai.use(cap);
chai.use(cs);
const expect = chai.expect;
const should = chai.should();

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

function aTransactionEntry(builder: { from: string, to: string, amount: number }, contractAddress?: string): types.TransactionEntry {
  const transaction: types.Transaction = {
    header: {
      version: 1,
      sender: {id: new Buffer(builder.from), networkId: 0, scheme: 0, checksum: 0},
      timestamp: Date.now().toString()
    },
    body: {
      contractAddress: {address: contractAddress || "foobar"},
      payload: JSON.stringify({
        method: "transfer",
        args: [builder.to, builder.amount]
      }),
    },
  };
  return {
    transaction,
    txHash: new Buffer("TBD") // TODO: calculate unique hash
  };
}

function buildCallRequest(accountName: string, contractAddress: string) {
  const senderAddress: types.UniversalAddress = {
    id: new Buffer(accountName),
    scheme: 0,
    checksum: 0,
    networkId: 0
  };

  const payload = JSON.stringify({
    method: "getMyBalance",
    args: []
  });

  return {
    sender: senderAddress,
    contractAddress: {address: contractAddress},
    payload: payload
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

    const contractRegistryConfig = {
      contracts: [
        {address: "foobar", filename: "foobar-smart-contract"}
      ]
    };

    virtualMachine = new VirtualMachine(contractRegistryConfig, stateStorage);
  });

  it("rejects a transaction with a non-positive amount", async () => {
    const transaction = aTransactionEntry({ from: "account1", to: "account2", amount: 0 });

    const { transactionReceipts, stateDiff } = await virtualMachine.processTransactionSet({
      orderedTransactions: [transaction]
    });
    expect(transactionReceipts).to.have.lengthOf(1);
    expect(transactionReceipts[0].success).to.be.false;
  });

  it("explodes on an unexpected error", async () => {
    const transaction = aTransactionEntry({ from: "foo", to: "bar", amount: 0 }, "zagzag");

    return chai.expect(virtualMachine.processTransactionSet({ orderedTransactions: [transaction] })).to.be.rejected;
  });

  it("#processTransactionSet - ordered transfers between 3 accounts", async () => {
    const { transactionReceipts, stateDiff } = await virtualMachine.processTransactionSet({
      orderedTransactions: [    // account1=10
        aTransactionEntry({ from: "account1", to: "account2", amount: 9 }), // account1 = 1, account2 = 9
        aTransactionEntry({ from: "account2", to: "account1", amount: 2 }), // account1 = 3, account2 = 7
        aTransactionEntry({ from: "account1", to: "account3", amount: 2 })  // account1 = 1, account2 = 7, account3 = 2
      ]
    });

    stateDiff.forEach(item => expect(item).to.have.property("contractAddress").eql({address: "foobar"}));

    expect(stateDiff).to
      .have.lengthOf(3)
      .and.containSubset([{key: "balances.account1", value: "1"}])
      .and.containSubset([{key: "balances.account2", value: "7"}])
      .and.containSubset([{key: "balances.account3", value: "2"}]);
  });


  it("#processTransactionSet - ordered transfers between 3 accounts (with a failed transaction in between)", async () => {
    const { transactionReceipts, stateDiff } = await virtualMachine.processTransactionSet({
      orderedTransactions: [    // account1=10
        aTransactionEntry({ from: "account1", to: "account2", amount: 9 }), // account1 = 1, account2 = 9
        aTransactionEntry({ from: "account2", to: "account1", amount: 2 }), // account1 = 3, account2 = 7
        aTransactionEntry({ from: "account1", to: "account2", amount: 4 }), // account1 = 3, account2 = 7
        aTransactionEntry({ from: "account1", to: "account3", amount: 2 })  // account1 = 1, account2 = 7, account3 = 2
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

  it("calls a smart contract", async () => {
    const validPayload = JSON.stringify({
      method: "getMyBalance",
      args: []
    });

    const result = await virtualMachine.callContract(buildCallRequest("account1", "foobar"));

    expect(result).to.equal(10);
  });

  it("calls a smart contract with an invalid payload - should not panic", async () => {
    const callObject = buildCallRequest("account1", "foobar");
    callObject.payload = "kuku";

    chai.expect(virtualMachine.callContract(callObject)).to.be.rejected;
  });
});
