const {Assertion, expect} = require("chai");
const Web3 = require("web3");
const ganache = require("ganache-cli");
const path = require("path");
const fs = require("fs");
const solc = require("solc");

import EthereumConnector from "../ethereum-connector";

const SIMPLE_STORAGE_SOLIDITY_CONTRACT = `
pragma solidity ^0.4.17;
contract SimpleStorage {
  uint myVariable;

  function SimpleStorage(uint x) public {
    myVariable = x;
  }

  function set(uint x) public {
    myVariable = x;
  }

  function get() constant public returns (uint) {
    return myVariable;
  }
}
`;

async function deployContract(web3, initialValue: number) {
    // compile contract
    const output = solc.compile(SIMPLE_STORAGE_SOLIDITY_CONTRACT, 1);
    const bytecode = output.contracts[":SimpleStorage"].bytecode;
    const abi = JSON.parse(output.contracts[":SimpleStorage"].interface);
    // deploy contract
    const contract = new web3.eth.Contract(abi, {data: "0x" + bytecode});
    const tx = contract.deploy({arguments: [initialValue]});
    const account = (await web3.eth.getAccounts())[0];
    return tx.send({
        from: account,
        gas: await tx.estimateGas()
    }).then(newContractInstance => {
        return newContractInstance.options.address;
    });
}

describe("Ethereum connector", () => {
    describe("testing connection to an Ethereum node simulator (aka Ganache)", () => {
    const ganacheProvider = ganache.provider({accounts: [{balance: "300000000000000000000"}], total_accounts: 1});
    const web3 = new Web3(ganacheProvider);
    const ganacheConnector = new EthereumConnector(web3);

        describe("call to a deployed SimpleStorage contract's get() method", () => {
            const randomInt = Math.floor(Math.random() * 10000000);
            let contractAddress;
            let res;
            before(async function() {
                this.timeout(30000);
                contractAddress = await deployContract(web3, randomInt);
                res = await ganacheConnector.call(
                    contractAddress,
                    {name: "get", inputs: [], outputs: [{name: "", type: "uint256"}]},
                    []
                );
            });
            it("should return the value passed to the contract constructor", () => {
                expect(res).to.own.property("result", randomInt.toString());
            });
            it("should return a valid block with a recent timestamp", () => {
                expect(res.block).to.exist;
                expect(res.block).to.own.property("timestamp");
                const now = Date.now() / 1000;
                expect(res.block.timestamp).to.be.gt(now - 600);
                expect(res.block.timestamp).to.be.lt(now + 10);
            });
        });
    });
});
