import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { TransactionHandler } from "../public-api/transaction-handler";
import { StartupCheck } from "../common-library/startup-check";
import { StartupStatus, STARTUP_STATUS } from "../common-library/startup-status";

export class PublicApi implements StartupCheck {
  private SERVICE_NAME = "public-api";
  private transactionHandler: TransactionHandler;
  private virtualMachine: types.VirtualMachineClient;
  private transactionPool: types.TransactionPoolClient;

  public constructor(transactionHandler: TransactionHandler, virtualMachine: types.VirtualMachineClient, transactionPool: types.TransactionPoolClient) {
    this.transactionHandler = transactionHandler;
    this.virtualMachine = virtualMachine;
    this.transactionPool = transactionPool;
  }

  public async sendTransaction(transactionContext: types.SendTransactionInput): Promise<string> {
    const txid = await this.transactionHandler.handle(transactionContext);
    return txid;
  }

  public async callContract(input: types.CallContractInput) {
    const { resultJson } = await this.virtualMachine.callContract({
      sender: input.sender,
      payload: input.payload,
      contractAddress: input.contractAddress
    });

    return resultJson;
  }

  public async getTransactionStatus(input: types.GetTransactionStatusInput) {
    return this.transactionPool.getTransactionStatus(input);
  }

  public async startupCheck(): Promise<StartupStatus> {

    if (!this.transactionHandler) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Missing transactionHandler" };
    }

    if (!this.virtualMachine) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Missing virtualMachine" };
    }

    if (!this.transactionPool) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Missing transactionPool" };
    }

    return { name: this.SERVICE_NAME, status: STARTUP_STATUS.OK };
  }

}
