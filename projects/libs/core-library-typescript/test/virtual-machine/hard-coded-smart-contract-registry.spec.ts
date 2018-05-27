import "mocha";
import { expect } from "chai";
import { Contract, HardCodedSmartContractRegistry, HardCodedSmartContractRegistryConfig } from "../../src/virtual-machine/hard-coded-contracts/hard-coded-smart-contract-registry";
import { Address } from "../../src/common-library/address";

function stubConfig(contracts: Contract[]) {
  return {
    registryRoot: __dirname,
    contracts
  };
}

const STUB_CONTRACT_FILE_NAME =  "stub-contract";

const VCHAIN_ID = "010101";
const CONTRACT_NAME = "test";
const CONTRACT_ADDRESS = Address.createContractAddress(CONTRACT_NAME, VCHAIN_ID);

describe("the hard-coded smart contract registry", () => {
  let registry: HardCodedSmartContractRegistry;
  beforeEach(() => {
    registry = new HardCodedSmartContractRegistry(stubConfig([{vchainId: VCHAIN_ID, name: CONTRACT_NAME, filename: STUB_CONTRACT_FILE_NAME, networkId: Address.TEST_NETWORK_ID}]));
  });

  it("retrieves a contract by address", () => {
    registry = new HardCodedSmartContractRegistry(stubConfig([{vchainId: VCHAIN_ID, name: CONTRACT_NAME, filename: STUB_CONTRACT_FILE_NAME, networkId: Address.TEST_NETWORK_ID}]));

    expect(registry.getContractByRawAddress(CONTRACT_ADDRESS.toBuffer())).to.have.property("default").that.is.a("function");
  });
});
