import "mocha";
import { expect } from "chai";
import { Contracts, HardCodedSmartContractRegistry, HardCodedSmartContractRegistryConfig } from "../../src/virtual-machine/hard-coded-contracts/hard-coded-smart-contract-registry";
import { createContractAddress } from "../../src/common-library/address";

function stubConfig(contracts: Contracts) {
  return {
    registryRoot: __dirname,
    contracts
  };
}

const STUB_CONTRACT_FILE_NAME =  "stub-contract";

const VCHAIN_ID = "010101";
const CONTRACT_NAME = "test";
const CONTRACT_ADDRESS = createContractAddress(CONTRACT_NAME, VCHAIN_ID);

describe("the hard-coded smart contract registry", () => {
  let registry: HardCodedSmartContractRegistry;
  beforeEach(() => {
    registry = new HardCodedSmartContractRegistry(stubConfig([{vchainId: "010101", name: CONTRACT_NAME, filename: STUB_CONTRACT_FILE_NAME}]));
  });

  it("retrieves a contract by address", () => {
    registry = new HardCodedSmartContractRegistry(stubConfig([{vchainId: "010101", name: CONTRACT_NAME, filename: STUB_CONTRACT_FILE_NAME}]));

    expect(registry.getContractByRawAddress(CONTRACT_ADDRESS.toBuffer())).to.have.property("default").that.is.a("function");
  });
});
