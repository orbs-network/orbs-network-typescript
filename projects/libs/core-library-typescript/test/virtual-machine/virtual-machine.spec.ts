
import * as chai from "chai";
import { VirtualMachine } from "../../src/virtual-machine";
import { types } from "../../src/common-library";
import * as _ from "lodash";

class DummyStateStorageClient implements types.StateStorageClient {
    keyMap: {[id: string]: string};
    contractAddress: string;

    constructor(opts: {contractAddress: string, keyMap: {[id: string]: string}}) {
        this.contractAddress = opts.contractAddress;
        this.keyMap = opts.keyMap;
    }

    readKeys(input: types.ReadKeysInput): types.ReadKeysOutput {
        if (input.address != this.contractAddress) {
            throw `state storage supports only a single contract ${this.contractAddress} != ${input.address}`;
        }
        return { values: _.pick(this.keyMap, input.keys)};
    }
}

function buildBarTransferTransaction(from, to, amount): types.Transaction {
    return {
        version: 1,
        sender: from,
        contractAddress: "foobar",
        payload: JSON.stringify({
            method: "transfer",
            args: [to, amount]
        }),
        signature: ""
    };
}

describe("test virtual machine", () => {
    let virtualMachine: VirtualMachine;
    let stateStorageClient: DummyStateStorageClient;

    beforeEach(() => {
        stateStorageClient = new DummyStateStorageClient({
            contractAddress: "foobar",
            keyMap: {"balances.account1" : "10", "balances.account2": "0" }
        });
        virtualMachine = new VirtualMachine(stateStorageClient);
    });

    it("#executeTransaction", async () => {
        const transaction = buildBarTransferTransaction("account1", "account2", 4);
        const res = await virtualMachine.executeTransaction({
            transaction,
            transactionAppendix: { version: 1, prefetchAddresses: [], subscriptionKey: ""}
        });
        res.length.should.equal(2);
        for (const item of res) {
            item.should.have.property("key").have.property("contractAddress", "foobar");
        }
        res.find(item => item.key.key === "balances.account1").should.have.property("value", "6");
        res.find(item => item.key.key === "balances.account2").should.have.property("value", "4");
    });

    it("#processTransactionSet", async () => {
        const res = await virtualMachine.processTransactionSet({orderedTransactions: [    // account1=10
            buildBarTransferTransaction("account1", "account2", 9), // account1 = 1, account2 = 9
            buildBarTransferTransaction("account2", "account1", 2), // account1 = 3, account2 = 7
            buildBarTransferTransaction("account1", "account3", 2)  // account1 = 1, account2 = 7, account3 = 2
        ]});
        res.length.should.equal(3);
        for (const item of res) {
            item.should.have.property("key").have.property("contractAddress", "foobar");
        }
        res.find(item => item.key.key === "balances.account1").should.have.property("value", "1");
        res.find(item => item.key.key === "balances.account2").should.have.property("value", "7");
        res.find(item => item.key.key === "balances.account3").should.have.property("value", "2");
    });
});