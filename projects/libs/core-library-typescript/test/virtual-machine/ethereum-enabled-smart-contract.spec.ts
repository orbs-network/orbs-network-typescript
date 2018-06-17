import { expect } from "chai";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";

import { StateCache } from "../../src/virtual-machine/state-cache";
import { BaseContractStateAccessor } from "../../src/virtual-machine/contract-state-accessor";
import EthereumConnectedSampleSmartContract from "../../src/virtual-machine/hard-coded-contracts/registry/ethereum-connected-sample-smart-contract";
import BaseSmartContract from "../../src/virtual-machine/hard-coded-contracts/base-smart-contact";
import { types, SidechainConnector, grpc } from "../../src";
import { Address } from "../../src/common-library/address";
import { createHash } from "crypto";
import { SidechainConnectorClient } from "orbs-interfaces";
import { EthereumSimulator } from "ethereum-simulator";
import getPort from "get-port";


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
const ETH_CONTRACT = `pragma solidity ^0.4.0;
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


describe("ethereum connected contract simple example", () => {
  let adapter: ContractStateMemCacheAccessor;
  let accountContract: EthereumConnectedSampleSmartContract;
  const SIDE_CHAIN_CONNECTOR_ENDPOINT = "http://localhost:8888";
  let ethIntValue: number;
  let ethSim: EthereumSimulator;
  let contractAddress: string;

  beforeEach(async () => {
    adapter = new ContractStateMemCacheAccessor(CONTRACT_ADDRESS, new StateCache());
    accountContract = new EthereumConnectedSampleSmartContract(ACCOUNT_ADDRESS, adapter, SIDE_CHAIN_CONNECTOR_ENDPOINT);
    ethIntValue = Math.floor(Math.random() * 10000000);
    ethSim = new EthereumSimulator();
    ethSim.listen(await getPort());
    ethSim.addContract(ETH_CONTRACT);
    ethSim.setArguments(ethIntValue, "dont-care");
    contractAddress = await ethSim.compileAndDeployContractOnGanache();
  });

  afterEach(async () => {
    return ethSim.close();
  });

  it("should be able to read information from ethereum", async () => {
    const fromEth = await accountContract.getMyIntFromEth(ACCOUNT_ADDRESS, contractAddress);
    const fromOrbs = await accountContract.getInt(ACCOUNT_ADDRESS);
    expect(fromEth).to.be.equal(fromOrbs);
    return expect(fromOrbs).to.be.equal(ethIntValue);
  });

  it("should fail when there is a problem with the conntector", async () => {
    return expect(accountContract.getMyIntFromEth(ACCOUNT_ADDRESS, "not-a-contract-address")).to.eventually.rejectedWith("Failed getting data from ethereum with error");
  });

  it("should read 0 if there is no data loaded from ethereum", async () => {
    const shouldBeZero = accountContract.getInt(ACCOUNT_ADDRESS);
    return expect(shouldBeZero).to.be.equal(0);
  });


});