import { expect } from "chai";
import "mocha";

import { StateCache } from "../../src/virtual-machine/state-cache";
import { BaseContractStateAccessor } from "../../src/virtual-machine/contract-state-accessor";
import TextMessageSmartContract from "../../src/virtual-machine/hard-coded-contracts/registry/text-message-smart-contract";
import BaseSmartContract from "../../src/virtual-machine/hard-coded-contracts/base-smart-contact";

export default class ContractStateMemCacheAccessor extends BaseContractStateAccessor {
  lastBlockId: number;
  stateCache: StateCache;

  constructor(contractAddress: string, stateCache: StateCache) {
    super(contractAddress);

    this.stateCache = stateCache;
  }

  async load(key: string) {
    return this.stateCache.get({ contractAddress: this.contractAddress, key });
  }

  async store(key: string, value: string) {
    this.stateCache.set({ contractAddress: this.contractAddress, key }, value);
  }
}

const CONTRACT_ADDRESS = "text-message-contract-address";
const SENDER_ADDRESS = "Alice";
const RECIPIENT_ADDRESS = "Bob";
const adapter = new ContractStateMemCacheAccessor(CONTRACT_ADDRESS, new StateCache());
const senderContract = new TextMessageSmartContract(SENDER_ADDRESS, adapter);
const recipientContract = new TextMessageSmartContract(RECIPIENT_ADDRESS, adapter);

describe("text message contract ", () => {
  it("sends a message from one account to another", async () => {
    const timestamp = 1520881751236;

    await senderContract.sendMessage(RECIPIENT_ADDRESS, "hello", timestamp);
    const message = (await recipientContract.getMyMessages())[0];

    expect(message.timestamp).to.equal(timestamp);
    expect(message.processedAtTimestamp).to.be.greaterThan(timestamp);
    expect(message.message).to.equal("hello");
    expect(message.sender).to.equal("Alice");
    expect(message.recipient).to.equal("Bob");
  });
});
