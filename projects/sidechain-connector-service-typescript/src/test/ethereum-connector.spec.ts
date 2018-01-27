const {Assertion, expect} = require("chai");
const Web3 = require("web3");
const ganache = require("ganache-core");
const path = require("path");
const fs = require("fs");
const solc = require("solc");

import EthereumConnector from "../ethereum-connector";

const SIMPLE_STORAGE_SOLIDITY_CONTRACT = `
pragma solidity ^0.4.19;
contract SimpleStorage {
  struct Item {
      uint256 intValue;
      string stringValue;
  }
  Item item;

  function SimpleStorage(uint256 _intValue, string _stringValue) public {
      set(_intValue, _stringValue);
  }

  function set(uint256 _intValue, string _stringValue) private {
    item.intValue = _intValue;
    item.stringValue = _stringValue;
  }

  function getInt() constant public returns (uint256) {
    return item.intValue;
  }

  function getString() constant public returns (string) {
    return item.stringValue;
  }

  function getTuple() public view returns (Item) {
      return item;
  }

  function getValues() public view returns (uint256 intValue, string stringValue) {
    intValue = item.intValue;
    stringValue = item.stringValue;
  }
}
`;

async function deployContract(web3, intValue: number, stringValue: string) {
    // compile contract
    const output = solc.compile(SIMPLE_STORAGE_SOLIDITY_CONTRACT, 1);
    const bytecode = output.contracts[":SimpleStorage"].bytecode;
    const abi = JSON.parse(output.contracts[":SimpleStorage"].interface);
    // deploy contract
    const contract = new web3.eth.Contract(abi, {data: "0x" + bytecode});
    const tx = contract.deploy({arguments: [intValue, stringValue]});
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
            const intValue = Math.floor(Math.random() * 10000000);
            const stringValue = "foobar";
            let contractAddress;
            let res;
            before(async function() {
                this.timeout(30000);
                contractAddress = await deployContract(web3, intValue, stringValue);
                res = await ganacheConnector.call(
                    contractAddress, {
                        name: "getValues",
                        inputs: [],
                        outputs: [
                            {name: "intValue", type: "uint256"},
                            {name: "stringValue", type: "string"}
                        ]
                    }, []);
            });
            it("should return the values passed to the contract constructor", () => {
                expect(res).to.own.property("result");
                expect(res.result).to.own.property("intValue", intValue.toString());
                expect(res.result).to.own.property("stringValue", stringValue);
            });
            it("should return a valid block with a recent timestamp", () => {
                expect(res).to.own.property("block");
                expect(res.block).to.own.property("timestamp");
                const now = Date.now() / 1000;
                expect(res.block.timestamp).to.be.gt(now - 600);
                expect(res.block.timestamp).to.be.lt(now + 10);
            });
        });
    });
});
