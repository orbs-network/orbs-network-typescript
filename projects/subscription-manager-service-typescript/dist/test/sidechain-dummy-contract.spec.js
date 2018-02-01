"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { Assertion, expect } = require("chai");
const Web3 = require("web3");
const ganache = require("ganache-cli");
const path = require("path");
const fs = require("fs");
const solc = require("solc");
const SIMPLE_STORAGE_SOLIDITY_CONTRACT = `
pragma solidity 0.4.18;


/// @title Orbs billing and subscriptions smart contract.
contract stubOrbsToken  {
    struct Subscription {
        bytes32 id;
        uint256 tokens;
    }

    function getSubscription(bytes32 _id) public view returns (Subscription) {
        return Subscription();
    }
}
`;
function deployContract(web3, initialValue) {
    return __awaiter(this, void 0, void 0, function* () {
        // compile contract
        const output = solc.compile(SIMPLE_STORAGE_SOLIDITY_CONTRACT, 1);
        const bytecode = output.contracts[":SimpleStorage"].bytecode;
        const abi = JSON.parse(output.contracts[":SimpleStorage"].interface);
        // deploy contract
        const contract = new web3.eth.Contract(abi, { data: "0x" + bytecode });
        const tx = contract.deploy({ arguments: [initialValue] });
        const account = (yield web3.eth.getAccounts())[0];
        return tx.send({
            from: account,
            gas: yield tx.estimateGas()
        }).then((newContractInstance) => {
            return newContractInstance.options.address;
        });
    });
}
describe("Ethereum connector", () => {
    describe("testing connection to an Ethereum node simulator (aka Ganache)", () => {
        const ganacheProvider = ganache.provider({ accounts: [{ balance: "300000000000000000000" }], total_accounts: 1 });
        const web3 = new Web3(ganacheProvider);
        const ganacheConnector = new EthereumConnector(web3);
        describe("call to a deployed SimpleStorage contract's get() method", () => {
            const randomInt = Math.floor(Math.random() * 10000000);
            let contractAddress;
            let res;
            before(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    this.timeout(30000);
                    contractAddress = yield deployContract(web3, randomInt);
                    res = yield ganacheConnector.call(contractAddress, { name: "get", inputs: [], outputs: [{ name: "", type: "uint256" }] }, []);
                });
            });
            it("should return the value passed to the contract constructor", () => {
                expect(res).to.own.property("result", randomInt.toString());
            });
            it("should return a valid block with a recent timestamp", () => {
                expect(res.block).to.exist;
                expect(res.block).to.own.property("timestamp");
                const now = Date.now() / 1000;
                expect(res.block.timestamp).to.be.lt(now + 10);
            });
        });
    });
});
//# sourceMappingURL=sidechain-dummy-contract.spec.js.map