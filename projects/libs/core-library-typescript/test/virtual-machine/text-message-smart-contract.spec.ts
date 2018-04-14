import { expect } from "chai";
import "mocha";

import { StateCache } from "../../src/virtual-machine/state-cache";
import { BaseContractStateAccessor } from "../../src/virtual-machine/contract-state-accessor";
import TextMessageSmartContract from "../../src/virtual-machine/hard-coded-contracts/registry/text-message-smart-contract";
import BaseSmartContract from "../../src/virtual-machine/hard-coded-contracts/base-smart-contact";
import { types } from "../../src";
import Address, { createContractAddress } from "../../src/common-library/address";
import { createHash } from "crypto";

export default class ContractStateMemCacheAccessor extends BaseContractStateAccessor {
  lastBlockId: number;
  stateCache: StateCache;

  constructor(contractAddress: Buffer, stateCache: StateCache) {
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

const CONTRACT_ADDRESS = createContractAddress("text-message-contract").toBuffer();
const ALICE_ADDRESS = new Address(createHash("sha256").update("Alice").digest()).toBase58();
const BOB_ADDRESS = new Address(createHash("sha256").update("Bob").digest()).toBase58();

let adapter: BaseContractStateAccessor;
let aliceContract: BaseSmartContract;
let bobContract: BaseSmartContract;

describe("text message contract ", () => {
  beforeEach(() => {
    adapter = new ContractStateMemCacheAccessor(CONTRACT_ADDRESS, new StateCache());
    aliceContract = new TextMessageSmartContract(ALICE_ADDRESS, adapter);
    bobContract = new TextMessageSmartContract(BOB_ADDRESS, adapter);
  });


  it("sends a message from one account to another", async () => {
    const timestamp = 1520881751236;

    await aliceContract.sendMessage(BOB_ADDRESS, "hello", timestamp);
    const message = (await bobContract.getMyMessages())[0];

    expect(message.timestamp).to.equal(timestamp);
    expect(message.processedAtTimestamp).to.be.greaterThan(timestamp);
    expect(message.message).to.equal("hello");
    expect(message.sender).to.equal(ALICE_ADDRESS);
    expect(message.recipient).to.equal(BOB_ADDRESS);
  });

  it("sends multiple messages between accounts", async () => {
    const timestamp1 = 1520881751236;
    const timestamp2 = 1520881751236;
    const timestamp3 = 1520881751236;

    await aliceContract.sendMessage(BOB_ADDRESS, "hello", timestamp1);
    await bobContract.sendMessage(ALICE_ADDRESS, "sup", timestamp2);
    await aliceContract.sendMessage(BOB_ADDRESS, "is anybody in here?", timestamp3);

    const bobMessages = await bobContract.getMyMessages();

    expect(bobMessages.length).to.equal(2);

    const [ bobMessage1, bobMessage2 ] = bobMessages;

    expect(bobMessage1.timestamp).to.equal(timestamp1);
    expect(bobMessage1.processedAtTimestamp).to.be.greaterThan(timestamp1);
    expect(bobMessage1.message).to.equal("hello");
    expect(bobMessage1.sender).to.equal(ALICE_ADDRESS);
    expect(bobMessage1.recipient).to.equal(BOB_ADDRESS);

    expect(bobMessage2.timestamp).to.equal(timestamp2);
    expect(bobMessage2.processedAtTimestamp).to.be.greaterThan(timestamp2);
    expect(bobMessage2.message).to.equal("is anybody in here?");
    expect(bobMessage2.sender).to.equal(ALICE_ADDRESS);
    expect(bobMessage2.recipient).to.equal(BOB_ADDRESS);

    const aliceMessages = await aliceContract.getMyMessages();

    expect(aliceMessages.length).to.equal(1);

    const [ aliceMessage1 ] = aliceMessages;

    expect(aliceMessage1.timestamp).to.equal(timestamp3);
    expect(aliceMessage1.processedAtTimestamp).to.be.greaterThan(timestamp3);
    expect(aliceMessage1.message).to.equal("sup");
    expect(aliceMessage1.sender).to.equal(BOB_ADDRESS);
    expect(aliceMessage1.recipient).to.equal(ALICE_ADDRESS);
  });
});
