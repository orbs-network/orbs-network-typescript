
import * as chai from "chai";
import { VirtualMachine } from "../../src/virtual-machine";
import { types, TransactionHelper } from "../../src/common-library";
import * as _ from "lodash";
import * as cap from "chai-as-promised";
import chaiSubset = require("chai-subset");
import * as path from "path";
import HardCodedSmartContractProcessor from "../../src/virtual-machine/hard-coded-contracts/processor";
import { HardCodedSmartContractRegistryConfig } from "../../src/virtual-machine/hard-coded-contracts/hard-coded-smart-contract-registry";
import { Address, createContractAddress } from "../../src/common-library/address";
import { createHash } from "crypto";
import { stubInterface } from "ts-sinon";

chai.use(cap);
chai.use(chaiSubset);
const expect = chai.expect;

const SMART_CONTRACT_NAME = "foobar";
const SMART_CONTRACT_VCHAIN = "010101";
const SMART_CONTRACT_ADDRESS = createContractAddress("foobar", SMART_CONTRACT_VCHAIN);
const ACCOUNT1 = new Address(createHash("sha256").update("account1").digest());
const ACCOUNT2 = new Address(createHash("sha256").update("account2").digest());
const ACCOUNT3 = new Address(createHash("sha256").update("account3").digest());

function aTransactionEntry(builder: { from: Address, to: Address, amount: number }, contractAddress?: Buffer): types.TransactionEntry {
  const transaction: types.Transaction = {
    header: {
      version: 1,
      sender: Buffer.from(builder.from.toBuffer()),
      timestamp: Date.now().toString(),
      contractAddress: contractAddress || SMART_CONTRACT_ADDRESS.toBuffer()
    },
    payload: JSON.stringify({
      method: "transfer",
      args: [builder.to.toBase58(), builder.amount]
    }),
  };
  return {
    transaction,
    txHash: new TransactionHelper(transaction).calculateHash()
  };
}

function buildCallRequest(account: Address, contractAddress: Address) {
  const payload = JSON.stringify({
    method: "getMyBalance",
    args: []
  });

  return {
    sender: account.toBuffer(),
    contractAddress: contractAddress.toBuffer(),
    payload: payload
  };
}

function accountBalanceKey(account: Address) {
  return `balances.${account.toBase58()}`;
}

describe("test virtual machine", () => {
  let virtualMachine: VirtualMachine;
  const stateStorage = stubInterface<types.StateStorageClient>();

  beforeEach(() => {
    (<sinon.SinonStub>stateStorage.readKeys).returns({values: {
      [accountBalanceKey(ACCOUNT1)]: "10",
      [accountBalanceKey(ACCOUNT2)]: "0"
    }});

    const contractRegistryConfig: HardCodedSmartContractRegistryConfig = {
      contracts: [
        {vchainId: SMART_CONTRACT_VCHAIN, name: SMART_CONTRACT_NAME, filename: "foobar-smart-contract"}
      ]
    };

    virtualMachine = new VirtualMachine(contractRegistryConfig, stateStorage);
  });

  it("rejects a transaction with a non-positive amount", async () => {
    const transaction = aTransactionEntry({ from: ACCOUNT1, to: ACCOUNT2, amount: 0 });

    const { transactionReceipts, stateDiff } = await virtualMachine.processTransactionSet({
      orderedTransactions: [transaction]
    });
    expect(transactionReceipts).to.have.lengthOf(1);
    expect(transactionReceipts[0].success).to.be.false;
  });

  it("explodes on an unexpected error (due to call to an unregistered contract)", async () => {
    const transaction = aTransactionEntry({ from: ACCOUNT1, to: ACCOUNT2, amount: 0 }, Buffer.from("zagzag"));

    return chai.expect(virtualMachine.processTransactionSet({ orderedTransactions: [transaction] })).to.be.rejected;
  });

  it("#processTransactionSet - ordered transfers between 3 accounts", async () => {
    const { transactionReceipts, stateDiff } = await virtualMachine.processTransactionSet({
      orderedTransactions: [    // account1=10
        aTransactionEntry({ from: ACCOUNT1, to: ACCOUNT2, amount: 9 }), // account1 = 1, account2 = 9
        aTransactionEntry({ from: ACCOUNT2, to: ACCOUNT1, amount: 2 }), // account1 = 3, account2 = 7
        aTransactionEntry({ from: ACCOUNT1, to: ACCOUNT3, amount: 2 })  // account1 = 1, account2 = 7, account3 = 2
      ]
    });

    stateDiff.forEach(item => expect(item).to.have.property("contractAddress").deep.equal(SMART_CONTRACT_ADDRESS.toBuffer()));

    expect(stateDiff).to
      .have.lengthOf(3)
      .and.containSubset([{key: accountBalanceKey(ACCOUNT1), value: "1"}])
      .and.containSubset([{key: accountBalanceKey(ACCOUNT2), value: "7"}])
      .and.containSubset([{key: accountBalanceKey(ACCOUNT3), value: "2"}]);
  });


  it("#processTransactionSet - ordered transfers between 3 accounts (with a failed transaction in between)", async () => {
    const { transactionReceipts, stateDiff } = await virtualMachine.processTransactionSet({
      orderedTransactions: [    // account1=10
        aTransactionEntry({ from: ACCOUNT1, to: ACCOUNT2, amount: 9 }), // account1 = 1, account2 = 9
        aTransactionEntry({ from: ACCOUNT2, to: ACCOUNT1, amount: 2 }), // account1 = 3, account2 = 7
        aTransactionEntry({ from: ACCOUNT1, to: ACCOUNT2, amount: 4 }), // account1 = 3, account2 = 7
        aTransactionEntry({ from: ACCOUNT1, to: ACCOUNT3, amount: 2 })  // account1 = 1, account2 = 7, account3 = 2
      ]
    });
    expect(stateDiff).to.have.lengthOf(3);
    for (const item of stateDiff) {
      expect(item).to.have.property("contractAddress").deep.equal(SMART_CONTRACT_ADDRESS.toBuffer());
    }
    expect(stateDiff).to.containSubset([{key: accountBalanceKey(ACCOUNT1), value: "1"}])
      .and.containSubset([{key: accountBalanceKey(ACCOUNT2), value: "7"}])
      .and.containSubset([{key: accountBalanceKey(ACCOUNT3), value: "2"}]);
  });

  it("calls a smart contract", async () => {
    const validPayload = JSON.stringify({
      method: "getMyBalance",
      args: []
    });

    const result = await virtualMachine.callContract(buildCallRequest(ACCOUNT1, SMART_CONTRACT_ADDRESS));

    expect(result).to.equal(10);
  });

  it("calls a smart contract with an invalid payload - should not panic", async () => {
    const callObject = buildCallRequest(ACCOUNT1, SMART_CONTRACT_ADDRESS);
    callObject.payload = "kuku";

    chai.expect(virtualMachine.callContract(callObject)).to.be.rejected;
  });
});
