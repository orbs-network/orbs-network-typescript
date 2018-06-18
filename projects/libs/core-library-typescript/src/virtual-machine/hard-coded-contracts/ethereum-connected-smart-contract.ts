import BaseSmartContract from "./base-smart-contact";
import { EthereumFunctionInterface } from "orbs-interfaces";
import { BaseContractStateAccessor } from "../contract-state-accessor";
import { SidechainConnector } from "../../sidechain-connector";
import { logger } from "../..";

export default abstract class EthereumConnectedSmartContract extends BaseSmartContract {
  readonly sidechainConnector: SidechainConnector;

  constructor(senderAddressBase58: string, state: BaseContractStateAccessor, ethereumEndpoint: string) {
    super(senderAddressBase58, state);
    this.sidechainConnector = new SidechainConnector({ nodeName: "virtual-machine-processor", ethereumNodeHttpAddress: ethereumEndpoint});
  }

  protected async callFromEthereum(contractAddress: string, functionInterface: EthereumFunctionInterface, parameters: string[]) {
    const fromEth = await this.sidechainConnector.callEthereumContract({ contractAddress, functionInterface, parameters });
    logger.info(JSON.stringify(fromEth));
    return fromEth.result;
  }
}