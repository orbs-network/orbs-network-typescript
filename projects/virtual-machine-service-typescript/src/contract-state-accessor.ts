import { types } from "orbs-common-library";
import StateCache from "./state-cache";

export abstract class BaseContractStateAccessor {
    protected contractAddress: string;

    constructor(contractAddress: string) {
        this.contractAddress = contractAddress;
    }

    async load(key: string): Promise<string> {
        throw new Error("Not Implemented");
    }

    async store(key: string, value: string) {
        throw new Error("Not Implemented");
    }
}

export class ContractStateReadOnlyAccessor extends BaseContractStateAccessor {
    stateStorageClient: types.StateStorageClient;
    lastBlockId: number;
    stateCache: StateCache;

    constructor(contractAddress: string, stateCache: StateCache, stateStorageClient: types.StateStorageClient, lastBlockId?: number) {
        super(contractAddress);
        this.stateCache = stateCache;
        this.stateStorageClient = stateStorageClient;
        this.contractAddress = contractAddress;
        this.lastBlockId = lastBlockId;
    }

    async load(key: string) {
        const value = this.stateCache.get({contractAddress: this.contractAddress, key});
        if (value != undefined)
            return value;

        const {values} = await this.stateStorageClient.readKeys({
            address: this.contractAddress,
            keys: [key],
            lastBlockId: this.lastBlockId == undefined ?  undefined : { value: this.lastBlockId }
        });
        return values[key];
    }

    async store(key: string, value: string) {
        throw new Error("read-only. storing values is not allowed");
    }
}

export class ContractStateReadWriteAccessor extends ContractStateReadOnlyAccessor {
    async store(key: string, value: string) {
        this.stateCache.set({contractAddress: this.contractAddress, key}, value);
    }
}