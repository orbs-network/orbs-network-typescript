import { expect } from "chai";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as getPort from "get-port";

import { EthereumFunctionInterface } from "ethereum-simulator";
import { StateCache } from "../../src/virtual-machine/state-cache";
import { BaseContractStateAccessor } from "../../src/virtual-machine/contract-state-accessor";
import EthereumConnectedSampleSmartContract from "../../src/virtual-machine/hard-coded-contracts/registry/ethereum-connected-sample-smart-contract";
import { Address } from "../../src/common-library/address";
import { createHash } from "crypto";
import { EthereumDriver, SimpleStorageContract } from "../../src/test-kit";

chai.use(chaiAsPromised);

export default class ContractStateMemCacheAccessor extends BaseContractStateAccessor {
  lastBlockId: number;
  stateCache: StateCache;

  constructor(contractAddress: Buffer, stateCache: StateCache) {
    super(contractAddress);

    this.stateCache = stateCache;
  }

  async load(key: string) {
    return this.stateCache.get({ contractAddress: this.contractAddress, key });
  }

  async store(key: string, value: string) {
    this.stateCache.set({ contractAddress: this.contractAddress, key }, value);
  }
}


const CONTRACT_ADDRESS = Address.createContractAddress("ethereum-sample").toBuffer();
const ACCOUNT_ADDRESS = new Address(createHash("sha256").update("some-account").digest()).toBase58();

describe("ethereum connected contract simple example", function () {
  this.timeout(10000);
  let adapter: ContractStateMemCacheAccessor;
  let accountContract: EthereumConnectedSampleSmartContract;
  let ethIntValue: number;
  let ethSim: EthereumDriver;
  let contractAddress: string;

  beforeEach(async () => {
    ethIntValue = Math.floor(Math.random() * 10000000);

    // start ethereum
    const ethereumSimPort = await getPort();
    const args = [ethIntValue, "dont-care"];
    ethSim = new EthereumDriver();
    await ethSim.start(ethereumSimPort, SimpleStorageContract, args);
    contractAddress = ethSim.contractAddress;

    const ETHEREUM_NODE_HTTP_ADDRESS = `http://127.0.0.1:${ethereumSimPort}`;

    adapter = new ContractStateMemCacheAccessor(CONTRACT_ADDRESS, new StateCache());
    accountContract = new EthereumConnectedSampleSmartContract(ACCOUNT_ADDRESS, adapter, ETHEREUM_NODE_HTTP_ADDRESS);
  });

  afterEach(async () => {
    return ethSim.stop();
  });

  it("validates ethereum-sim used correctly", async () => {
    const ethInterface: EthereumFunctionInterface = {
      name: "getInt",
      inputs: [],
      outputs: [
        { name: "intValue", type: "uint256" }
      ]
    };
    const fromEth = await ethSim.ethSim.callDataFromSimulator(contractAddress, ethInterface);
    return expect(fromEth.result).to.be.equal(ethIntValue.toString());
  });

  it("should be able to read information from ethereum", async () => {
    const fromEth = await accountContract.getMyIntFromEth(ACCOUNT_ADDRESS, contractAddress);
    const fromOrbs = await accountContract.getInt(ACCOUNT_ADDRESS);
    expect(fromEth).to.be.equal(fromOrbs);
    return expect(fromOrbs).to.be.equal(ethIntValue.toString());
  });

  it("should fail when there is a problem with the conntector", async () => {
    return expect(accountContract.getMyIntFromEth(ACCOUNT_ADDRESS, "not-a-contract-address")).to.eventually.rejectedWith("Failed getting data from ethereum with error");
  });

  it("should read 0 if there is no data loaded from ethereum", async () => {
    const shouldBeZero = await accountContract.getInt(ACCOUNT_ADDRESS);
    return expect(shouldBeZero).to.be.equal(0);
  });
});