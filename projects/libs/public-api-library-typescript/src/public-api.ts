import { logger, topology, topologyPeers, types } from "orbs-common-library";

export class PublicApi {
  private consensus = topologyPeers(topology.peers).consensus;
  private virtualMachine = topologyPeers(topology.peers).virtualMachine;

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

    logger.debug(`${topology.name}: called contract with ${JSON.stringify(input)}. result is: ${resultJson}`);

    return resultJson;
  }
}
