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

  function getInt() view public returns (uint256) {
    return item.intValue;
  }

  function getString() view public returns (string) {
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
   abstract getStoredDataFromMemory(): StorageContractItem;
}

export interface StorageContractItem {
    intValue: number;
    stringValue: string;
}

class EthereumSimImpl extends EthereumSim {
    public contractAddress: string;
    public ganacheServer: any;
    private port: number;
    private storedInt: number;
    private storedString: string;

    constructor() {
        super();
        this.ganacheServer = ganache.server({ accounts: [{ balance: "300000000000000000000" }], total_accounts: 1 });
    }

    public async listen(port: number): Promise<void> {
        this.port = port;
        return new Promise<void>((resolve, reject) => {
            this.ganacheServer.listen(port, function() {
                resolve();
            });
        });
    }

    public getEndpoint(): string {
        if (this.port == 0) {
            throw new Error("Simulator not listening on any endpoint");
        }
        return `http://localhost:${this.port}`;
    }

    public getStoredDataFromMemory(): StorageContractItem {
        return {
            intValue: this.storedInt,
            stringValue: this.storedString
        };
    }

    public async compileStorageContract(intValue: number, stringValue: string): Promise<string> {
        const web3 = new Web3(new Web3.providers.HttpProvider(this.getEndpoint()));

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
        const contractInstance = await <Contract>tx.send({
            from: account,
            gas: await tx.estimateGas()
        });

        this.storedInt = intValue;
        this.storedString = stringValue;

        return Promise.resolve<string>(contractInstance.options.address);
    }

    public close() {
        this.ganacheServer.close();
    }
}

export default async function createEthSimulator(port: number): Promise<EthereumSim> {
    const ethSim = new EthereumSimImpl();
    await ethSim.listen(port);

    const intValue = Math.floor(Math.random() * 10000000);
    const stringValue = "magic money!";

    ethSim.contractAddress = await ethSim.compileStorageContract(intValue, stringValue);

    return ethSim;
}