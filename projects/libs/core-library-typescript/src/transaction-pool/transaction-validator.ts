import { types, Address, logger } from "..";

export class TransactionValidator {
  subscriptionManager: types.SubscriptionManagerClient;

  public async validate(transaction: types.Transaction): Promise<boolean> {
    if (transaction.header.version !== 0) {
      throw new Error(`Invalid transaction version: ${transaction.header.version}`);
    }

    // deserializes addresses and validate checksums
    const senderAddress = Address.fromBuffer(transaction.header.sender, undefined, true);
    if (senderAddress == undefined) {
      logger.info(`address validation ${transaction.header.sender} failed on deserialization (fromBuffer())`);
      return false;
    }
    const contractAddress = Address.fromBuffer(transaction.header.contractAddress, undefined, true);
    if (contractAddress == undefined) {
      logger.info(`address validation ${transaction.header.contractAddress} failed on deserialization (fromBuffer())`);
      return false;
    }

    // check that virtual chains of sender and contract match
    if (senderAddress.virtualChainId != contractAddress.virtualChainId) {
      logger.info(`virtual chain of address and contract address should match ${senderAddress.virtualChainId} != ${contractAddress.virtualChainId}`);
      return false;
    }

    // checks subscription
    const subscriptionKey = this.getSubscriptionKey(contractAddress);
    const status = await this.subscriptionManager.getSubscriptionStatus({ subscriptionKey });

    if (!status.active) {
      logger.info("subscription ${subscriptionKey} not active");
    }

    return status.active;
  }

  private getSubscriptionKey(contractAddress: Address): string {
    // we create a subscription key by zero-left-padding the contract's vchain ID
    const subscriptionKey = "0x0000000000000000000000000000000000000000000000000000000000" + contractAddress.virtualChainId;
    return subscriptionKey;
  }

  constructor(subscriptionManager: types.SubscriptionManagerClient) {
    this.subscriptionManager = subscriptionManager;
  }
}
