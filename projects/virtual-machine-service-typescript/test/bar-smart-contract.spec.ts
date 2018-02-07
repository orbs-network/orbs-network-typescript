import { expect } from "chai";

import StateCache from "../src/state-cache";
import { BaseContractStateAccessor } from "../src/contract-state-accessor";
import BarSmartContract from "../src/hard-coded-contracts/registry/foobar-smart-contract";
import BaseSmartContract from "../src/hard-coded-contracts/base-smart-contact";

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

const CONTRACT_ADDRESS = "barbar";
const SENDER_ADDRESS = "1111";
const RECIPIENT_ADDRESS = "2222";
const adapter = new ContractStateMemCacheAccessor(CONTRACT_ADDRESS, new StateCache());
const senderContract = new BarSmartContract(SENDER_ADDRESS, adapter);
const recipientContract = new BarSmartContract(SENDER_ADDRESS, adapter);
const superuserContract = new BarSmartContract(BarSmartContract.SUPERUSER, adapter);

describe("bar contract - transfer tests", () => {
    it("init token balances", async () => {
        await superuserContract.initBalance(SENDER_ADDRESS, 1);
        await superuserContract.initBalance(RECIPIENT_ADDRESS, 1);
        expect(await senderContract.getMyBalance()).to.equal(1);
        expect(await recipientContract.getMyBalance()).to.equal(1);
    });
    it("transfers 1 token from one account to another", async () => {
        await superuserContract.initBalance(SENDER_ADDRESS, 2);
        await superuserContract.initBalance(RECIPIENT_ADDRESS, 0);

        await senderContract.transfer(RECIPIENT_ADDRESS, 1);

        expect(await senderContract.getMyBalance()).to.equal(1);
        expect(await recipientContract.getMyBalance()).to.equal(1);
    });
});
