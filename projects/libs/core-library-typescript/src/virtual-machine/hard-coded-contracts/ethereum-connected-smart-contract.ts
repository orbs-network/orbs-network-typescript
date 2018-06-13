import BaseSmartContract from "./base-smart-contact";
import { grpc } from "../../common-library/grpc";
import { EthereumFunctionInterface } from "orbs-interfaces";
import { BaseContractStateAccessor } from "../contract-state-accessor";

export default abstract class EthereumConnectedSmartContract extends BaseSmartContract {
  readonly sccEndpoint: string;

  constructor(senderAddressBase58: string, state: BaseContractStateAccessor, sideChainConnectorEndpoint: string) {
    super(senderAddressBase58, state);
    this.sccEndpoint = sideChainConnectorEndpoint;
  }

  callFromEthereum(contractAddress: string, functionInterface: EthereumFunctionInterface, parameters: string[]) {
    const client = grpc.sidechainConnectorClient({ endpoint: this.sccEndpoint });
    const fromEth = client.callEthereumContract({ contractAddress, functionInterface, parameters });
    return JSON.parse(fromEth.resultJson);
  }
}