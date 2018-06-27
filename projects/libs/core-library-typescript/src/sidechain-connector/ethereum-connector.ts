import { Block, Provider } from "web3/types";

import { types } from "../common-library/types";

const Web3 = require("web3");

export class EthereumConnector {
  private web3: any;

  public async call(contractAddress: string, functionInterface: types.EthereumFunctionInterface, parameters: Object[]) {
    const latestBlock: Block = await this.web3.eth.getBlock("latest");

    const callData = this.web3.eth.abi.encodeFunctionCall(functionInterface, parameters);

    const outputHexString = await this.web3.eth.call({ to: contractAddress, data: callData }, latestBlock.number);

    const output = this.web3.eth.abi.decodeParameters(functionInterface.outputs as any, outputHexString);

    return {
      result: output.__length__ === 1 ? output[0] : output,
      block: latestBlock
    };
  }

  constructor(web3Instance: any) {
    this.web3 = web3Instance;
  }

  static createHttpConnector(httpAddress: string) {
    return this.createFromWeb3Provider(new Web3.providers.HttpProvider(httpAddress));
  }

  static createFromWeb3Provider(web3Provider: Provider) {
    const web3 = new Web3(web3Provider);
    return new this(web3);
  }
}
