// purpose of this file is to simulate ethereum for the sidechain connector
import * as ganache from "ganache-core";
import * as solc from "solc";
const Web3 = require("web3");

import { Contract } from "web3/types";

const SIMPLE_STORAGE_SOLIDITY_CONTRACT = `
pragma solidity 0.4.18;
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

export abstract class EthereumSim {
   contractAddress: string;
   abstract close(): void;
}


class EthereumSimImpl extends EthereumSim {
    public contractAddress: string;
    public ganacheServer: any;

    constructor() {
        super();
        this.ganacheServer = ganache.server({ accounts: [{ balance: "300000000000000000000" }], total_accounts: 1 });
    }

    public async listen(port: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.ganacheServer.listen(port, function() {
                resolve();
            });
        });
    }

    public close() {
        this.ganacheServer.close();
    }
}

export default async function createEthSimulator(port: number): Promise<EthereumSim> {
    const ethSim = new EthereumSimImpl();
    await ethSim.listen(port);
    const endpoint = `http://localhost:${port}`;

    const web3 = new Web3(new Web3.providers.HttpProvider(endpoint));
    const intValue = Math.floor(Math.random() * 10000000);
    const stringValue = "foobar";

    // compile contract
    const output = solc.compile(SIMPLE_STORAGE_SOLIDITY_CONTRACT, 1);
    if (output.errors)
        throw output.errors;
    const bytecode = output.contracts[":SimpleStorage"].bytecode;
    const abi = JSON.parse(output.contracts[":SimpleStorage"].interface);
    // deploy contract
    const contract = new web3.eth.Contract(abi, { data: "0x" + bytecode });
    const tx = contract.deploy({ arguments: [intValue, stringValue] });
    const account = (await web3.eth.getAccounts())[0];
    const contractInstance = await tx.send({
        from: account,
        gas: await tx.estimateGas()
    });

    ethSim.contractAddress = contractInstance.options.address;

    return ethSim;
}