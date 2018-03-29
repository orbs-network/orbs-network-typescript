import "mocha";
import { expect } from "chai";
import { Contracts, HardCodedSmartContractRegistry, HardCodedSmartContractRegistryConfig } from "../../src/virtual-machine/hard-coded-contracts/hard-coded-smart-contract-registry";

function stubConfig(contracts: Contracts) {
  return {
    registryRoot: __dirname,
    contracts
  };
}

const STUB_CONTRACT_FILE_NAME =  "stub-contract";

describe("the hard-coded smart contract registry", () => {

  it("registers contracts from config when a config is provided", () => {

    const registry = new HardCodedSmartContractRegistry(stubConfig([{address: "address1", filename: STUB_CONTRACT_FILE_NAME}]));

    expect(registry.contractAddresses()).to.eql(["address1"]);
  });

  it("retreives a contract by address", () => {
    const registry = new HardCodedSmartContractRegistry(stubConfig([{address: "test", filename: STUB_CONTRACT_FILE_NAME}]));

    expect(registry.getContract("test")).to.have.property("default").that.is.a("function");
  });
});
