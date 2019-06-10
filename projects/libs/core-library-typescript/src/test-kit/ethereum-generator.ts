import { EthereumSimulator } from "ethereum-simulator";

export const SimpleStorageContract = `pragma solidity ^0.4.0;
contract SimpleStorage {
    struct Item {
        uint256 intValue;
        string stringValue;
    }
    Item item;

    constructor(uint256 _intValue, string _stringValue) public {
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

    function getValues() public view returns (uint256 intValue, string stringValue) {
        intValue = item.intValue;
        stringValue = item.stringValue;
    }
}`;

export class EthereumDriver {
  public ethSim: EthereumSimulator;
  public contractAddress: string;

  public async start(port: number, contract: string, args: any[]) {
    this.ethSim = new EthereumSimulator();
    this.ethSim.listen(port);
    this.ethSim.addContract(contract);
    this.ethSim.setArguments(...args);
    this.contractAddress = await this.ethSim.compileAndDeployContractOnGanache();
  }

  public async stop() {
    this.ethSim.close();
  }
}
