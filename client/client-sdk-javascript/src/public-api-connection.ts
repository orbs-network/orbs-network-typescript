import { SendTransactionInput, SendTransactionOutput, CallContractInput, CallContractOutput } from "orbs-interfaces";

export default interface PublicApiConnection {
  sendTransaction(sendTransactionInput: SendTransactionInput): SendTransactionOutput;
  callContract(callContractInput: CallContractInput): CallContractOutput;
  close(): Promise<void>;
}
