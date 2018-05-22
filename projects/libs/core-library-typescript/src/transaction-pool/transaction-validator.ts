import { types, Address, logger, TransactionHelper } from "..";
import { eddsa } from "elliptic";
const ec = new eddsa("ed25519");


export interface TransactionValidatorOptions {
  verifySignature: boolean;
  verifySubscription: boolean;
}

export class TransactionValidator {
  subscriptionManager: types.SubscriptionManagerClient;
  options: TransactionValidatorOptions;

  public async validate(tx: types.Transaction): Promise<boolean> {
    if (tx.header.version !== 0) {
      throw new Error(`Invalid transaction version: ${tx.header.version}`);
    }

    if ((this.options.verifySignature) && (!this.verifySignature(tx))) {
      logger.info(`Signature of ${JSON.stringify(tx)} is invalid`);
      return false;
    }

    // deserializes addresses and validate checksums
    const senderAddress = Address.fromBuffer(tx.header.sender, undefined, true);
    if (senderAddress == undefined) {
      logger.info(`Address validation ${tx.header.sender} failed on deserialization (fromBuffer())`);
      return false;
    }
    const contractAddress = Address.fromBuffer(tx.header.contractAddress, undefined, true);
    if (contractAddress == undefined) {
      logger.info(`Address validation ${tx.header.contractAddress} failed on deserialization (fromBuffer())`);
      return false;
    }

    // check that virtual chains of sender and contract match
    if (senderAddress.virtualChainId != contractAddress.virtualChainId) {
      logger.info(`Virtual chain of address and contract address should match ${senderAddress.virtualChainId} != ${contractAddress.virtualChainId}`);
      return false;
    }

    if (!this.options.verifySubscription) {
      return true;
    }

    // checks subscription
    const subscriptionKey = this.getSubscriptionKey(contractAddress);
    const status = await this.subscriptionManager.getSubscriptionStatus({ subscriptionKey });

    if (!status.isValid) {
      logger.info(`Subscription ${subscriptionKey} not valid`);
    }

    return status.isValid;
  }

  private verifySignature(tx: types.Transaction) {
    const txHelper = new TransactionHelper(tx);
    const hash = txHelper.calculateHash();
    const key = ec.keyFromPublic(tx.signatureData.publicKey.toString("hex"));
    return key.verify(hash, tx.signatureData.signature.toString("hex"));
  }

  private getSubscriptionKey(contractAddress: Address): string {
    // we create a subscription key by zero-left-padding the contract's vchain ID
    const subscriptionKey = "0x0000000000000000000000000000000000000000000000000000000000" + contractAddress.virtualChainId;
    return subscriptionKey;
  }

  constructor(subscriptionManager: types.SubscriptionManagerClient, options: TransactionValidatorOptions) {
    this.subscriptionManager = subscriptionManager;
    this.options = options;
  }
}
