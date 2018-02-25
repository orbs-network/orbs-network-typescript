
import * as chai from "chai";
import { VirtualMachine } from "../../src/virtual-machine";
import { types } from "../../src/common-library";
import * as _ from "lodash";

class StubStorageClient implements types.StateStorageClient {
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

function aTransaction(builder: {from: string, to: string, amount: number}): types.Transaction {
    return {
        version: 1,
        sender: builder.from,
        contractAddress: "foobar",
        payload: JSON.stringify({
            method: "transfer",
            args: [builder.to, builder.amount]
        }),
        signature: ""
    };
}

describe("test virtual machine", () => {
    let virtualMachine: VirtualMachine;
    let stateStorage: StubStorageClient;

    beforeEach(() => {
        stateStorage = new StubStorageClient({
            contractAddress: "foobar",
            keyMap: {"balances.account1" : "10", "balances.account2": "0" }
        });
        virtualMachine = new VirtualMachine(stateStorage);
    });

    it("#processTransactionSet - ordered transfers between 3 accounts", async () => {
        const { processedTransactions, stateDiff } = await virtualMachine.processTransactionSet({orderedTransactions: [    // account1=10
            aTransaction({from: "account1", to: "account2", amount: 9}), // account1 = 1, account2 = 9
            aTransaction({from: "account2", to: "account1", amount: 2}), // account1 = 3, account2 = 7
            aTransaction({from: "account1", to: "account3", amount: 2})  // account1 = 1, account2 = 7, account3 = 2
        ]});
        stateDiff.should.have.lengthOf(3);
        for (const item of stateDiff) {
            item.should.have.property("contractAddress", "foobar");
        }
        stateDiff.find(item => item.key === "balances.account1").should.have.property("value", "1");
        stateDiff.find(item => item.key === "balances.account2").should.have.property("value", "7");
        stateDiff.find(item => item.key === "balances.account3").should.have.property("value", "2");
    });
});