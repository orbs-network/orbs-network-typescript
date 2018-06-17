import BaseSmartContract from "./base-smart-contact";
import { EthereumFunctionInterface } from "orbs-interfaces";
import { BaseContractStateAccessor } from "../contract-state-accessor";
import { SidechainConnector } from "../../sidechain-connector";

export default abstract class EthereumConnectedSmartContract extends BaseSmartContract {
  readonly sidechainConnector: SidechainConnector;

  constructor(senderAddressBase58: string, state: BaseContractStateAccessor, ethereumEndpoint: string) {
    super(senderAddressBase58, state);
    this.sidechainConnector = new SidechainConnector({ nodeName: "virtual-machine-processor", ethereumNodeHttpAddress: ethereumEndpoint});
  }

  callFromEthereum(contractAddress: string, functionInterface: EthereumFunctionInterface, parameters: string[]) {
    const fromEth = this.sidechainConnector.callEthereumContract({ contractAddress, functionInterface, parameters });
    return fromEth.then((res) => res.result);
  }
}