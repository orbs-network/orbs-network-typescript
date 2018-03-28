import "mocha";
import { expect } from "chai";
import { Contracts, HardCodedSmartContractRegistry, HardCodedSmartContractRegistryConfig } from "../../src/virtual-machine/hard-coded-contracts/hard-coded-smart-contract-registry";

class StubConfig implements HardCodedSmartContractRegistryConfig {
  stubContracts: Contracts;
  root: string;

  constructor(stubContracts: Contracts,) {
    this.stubContracts = stubContracts;
  }

  contracts(): Contracts {
    return this.stubContracts;
  }

  registryRoot() {
    return __dirname;
  }
}

const STUB_CONTRACT_FILE_NAME =  "stub-contract";

describe("the hard-coded smart contract registry", () => {
  it("register the default contracts when not given configuration", () => {
    const registry = new HardCodedSmartContractRegistry();

    expect(registry.contractAddresses()).to.include.members(["foobar", "text-message"]);
  });

  it("registers contracts from config when a config is provided", () => {

    const registry = new HardCodedSmartContractRegistry(new StubConfig([{address: "address1", filename: STUB_CONTRACT_FILE_NAME}]));

    expect(registry.contractAddresses()).to.eql(["address1"]);
  });

  it("retreives a contract by address", () => {
    const registry = new HardCodedSmartContractRegistry(new StubConfig([{address: "test", filename: STUB_CONTRACT_FILE_NAME}]));

    expect(registry.getContract("test")).to.have.property("default").that.is.a("function");
  });
});
