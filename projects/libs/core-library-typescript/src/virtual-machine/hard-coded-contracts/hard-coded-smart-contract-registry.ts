import * as path from "path";

export type Contracts = { address: string; filename: string; }[];

export interface HardCodedSmartContractRegistryConfig {
  contracts: Contracts;
  registryRoot?: string;
}

export class HardCodedSmartContractRegistry {
  loadedContracts = new Map<string, any>();

  constructor(config: HardCodedSmartContractRegistryConfig) {
    const contractsToLoad =  config.contracts || [];
    const root = config.registryRoot || path.resolve(__dirname, "registry");
    contractsToLoad.forEach(contract => this.registerContract(contract.address, contract.filename, root));
  }

  private registerContract(address: string, filename: string, root: string) {
    const theModule = require(path.resolve(root, filename)); // TODO this is extremely unsafe; replace with something that has some notion of security
    this.loadedContracts.set(address, theModule);
  }

  public contractAddresses(): string[] {
    return Array.from(this.loadedContracts.keys());
  }

  public getContract(address: string): any {
    return this.loadedContracts.get(address);
  }
}
