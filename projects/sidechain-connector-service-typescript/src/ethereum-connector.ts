const Web3 = require("web3");
import { Block } from "web3/types.d";
import { types } from "orbs-common-library";

export default class EthereumConnector {
    private web3;

    public async call(contractAddress: string, functionInterface: types.EthereumFunctionInterface, parameters: Object[], block?: Block) {
        if (block == undefined)
            block = await this.getEarlierBlock();

        const callData = this.web3.eth.abi.encodeFunctionCall(functionInterface, parameters);

        const outputHexString = await this.web3.eth.call({to: contractAddress, data: callData}, block && block.number);

        const output = this.web3.eth.abi.decodeParameters(functionInterface.outputs as any, outputHexString);

        return {
            result: output.__length__ === 1 ? output[0] : output,
            block: block
        };
    }

    constructor(web3Instance) {
        this.web3 = web3Instance;
    }

    async getEarlierBlock(numOfBlocksBack: number = 100) {
        const latestBlockNumber = await this.web3.eth.getBlockNumber();
        return this.web3.eth.getBlock(Math.max(latestBlockNumber - numOfBlocksBack, 0));
    }

    static createHttpConnector(httpAddress: string) {
        const web3 = new Web3(new Web3.providers.HttpProvider(httpAddress));
        return new this(web3);
    }
}
