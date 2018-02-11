import { BaseContractStateAccessor } from "../contract-state-accessor";

export default abstract class BaseSmartContract {
    [index: string]: any;

    readonly stateAccessor: BaseContractStateAccessor;
    readonly sender: string;

    constructor(sender: string, stateAccessor: BaseContractStateAccessor) {
        this.sender = sender;
        this.stateAccessor = stateAccessor;
    }
}