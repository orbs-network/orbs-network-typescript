import EthereumConnectedSmartContract from "../ethereum-connected-smart-contract";
import { EthereumFunctionInterface } from "orbs-interfaces";

export default class EthereumConnectedSampleSmartContract extends EthereumConnectedSmartContract {

  // this is a sample contract, most likely that the contract address will be hard coded and not a input param
  public async getMyIntFromEth(recipient: string, ethereumContractAddress: string) {
    const ethInterface: EthereumFunctionInterface = {
      name: "getInt",
      inputs: [],
      outputs: [
        { name: "intValue", type: "uint256" }
      ]
    };
    let fromEth: any;
    try {
      fromEth = this.callFromEthereum(ethereumContractAddress, ethInterface, []);
    }
    catch (e) {
      throw this.validationError("failed getting data from ethereum");
    }
    await this.setInt(recipient, fromEth["intValue"]);
    return fromEth["intValue"];
  }

  public async getInt(account: string) {
    const theInt = await this.state.load(this.getIntKey(account));
    return theInt != undefined ? JSON.parse(theInt) : 0;
  }

  private async setInt(account: string, value: number) {
    return this.state.store(this.getIntKey(account), JSON.stringify(value));
  }

  private getIntKey(account: string) {
    return `fromEth.intValue.${account}`;
  }
}
