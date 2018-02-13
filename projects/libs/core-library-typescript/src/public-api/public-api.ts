import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { TransactionHandler } from "../public-api/transaction-handler";

export class PublicApi {
  private transactionHandler: TransactionHandler;
  private virtualMachine: types.VirtualMachineClient;

  public constructor(transactionHandler: TransactionHandler, virtualMachine: types.VirtualMachineClient) {
    this.transactionHandler = transactionHandler;
    this.virtualMachine = virtualMachine;
  }

  public async sendTransaction(transactionContext: types.SendTransactionInput) {
    await this.transactionHandler.handle(transactionContext);
  }

  public async callContract(input: types.CallContractInput) {
    const { resultJson } = await this.virtualMachine.callContract({
      sender: input.sender,
      payload: input.payload,
      contractAddress: input.contractAddress
    });

    return resultJson;
  }
}
