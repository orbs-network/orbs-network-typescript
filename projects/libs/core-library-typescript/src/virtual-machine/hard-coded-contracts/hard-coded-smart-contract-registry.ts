/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as path from "path";
import { Address, bs58EncodeRawAddress, logger } from "../../common-library";

export interface Contract {
  vchainId: string;
  name: string;
  filename: string;
  networkId: string;
}

export interface HardCodedSmartContractRegistryConfig {
  contracts: Contract[];
  registryRoot?: string;
}

export class HardCodedSmartContractRegistry {
  private loadedContracts = new Map<string, any>();

  constructor(config: HardCodedSmartContractRegistryConfig) {
    const contractsToLoad =  config.contracts || [];
    const root = config.registryRoot || path.resolve(__dirname, "registry");
    contractsToLoad.forEach(contract => this.registerContract(contract.vchainId, contract.networkId, contract.name, contract.filename, root));
  }

  private registerContract(vchainId: string, networkId: string, name: string, filename: string, root: string) {
    const theModule = require(path.resolve(root, filename)); // TODO this is extremely unsafe; replace with something that has some notion of security

    const contractAddress = Address.createContractAddress(name, vchainId, networkId);

    this.loadedContracts.set(contractAddress.toBase58(), theModule);

    logger.info(`Registered a new contract with address ${contractAddress.toBase58()}. vchainId: ${vchainId}, name: ${name}, filename: ${filename}`);

    return contractAddress;
  }

  public getContractByRawAddress(address: Buffer): any {
    return this.loadedContracts.get(bs58EncodeRawAddress(address));
  }
}
