import { logger, types } from "../common-library";

export class PublicApi {
  private consensus: types.ConsensusClient;
  private virtualMachine: types.VirtualMachineClient;

  public constructor(consensus: types.ConsensusClient, virtualMachine: types.VirtualMachineClient) {
    this.consensus = consensus;
    this.virtualMachine = virtualMachine;
  }

  public async sendTransaction(transactionContext: types.SendTransactionInput) {
    const subscriptionKey = transactionContext.transactionAppendix.subscriptionKey;
    // console.log("sendTransaction", this.peers.subscriptionManager);
    // const { active } = await this.peers.subscriptionManager.getSubscriptionStatus({ subscriptionKey });
    // if (!active) {
    //   throw new Error(`subscription with key [${subscriptionKey}] inactive`);
    // }
    await this.consensus.sendTransaction(transactionContext);
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
