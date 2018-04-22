import * as path from "path";
import { Address, bs58EncodeRawAddress, logger } from "../../common-library";

export type Contracts = { vchainId: string, name: string; filename: string; }[];

export interface HardCodedSmartContractRegistryConfig {
  contracts: Contracts;
  registryRoot?: string;
}

export class HardCodedSmartContractRegistry {
  private loadedContracts = new Map<string, any>();

  constructor(config: HardCodedSmartContractRegistryConfig) {
    const contractsToLoad =  config.contracts || [];
    const root = config.registryRoot || path.resolve(__dirname, "registry");
    contractsToLoad.forEach(contract => this.registerContract(contract.vchainId, contract.name, contract.filename, root));
  }

  private registerContract(vchainId: string, name: string, filename: string, root: string) {
    const theModule = require(path.resolve(root, filename)); // TODO this is extremely unsafe; replace with something that has some notion of security

    const contractAddress = Address.createContractAddress(name, vchainId);

    this.loadedContracts.set(contractAddress.toBase58(), theModule);

    logger.info(`Registered a new contract with address ${contractAddress.toBase58()}. vchainId: ${vchainId}, name: ${name}, filename: ${filename}`);

    return contractAddress;
  }

  public getContractByRawAddress(address: Buffer): any {
    return this.loadedContracts.get(bs58EncodeRawAddress(address));
  }
}
