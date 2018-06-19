import { BaseContractStateAccessor } from "../contract-state-accessor";

export default abstract class BaseSmartContract {
  [index: string]: any;

  readonly state: BaseContractStateAccessor;
  readonly senderAddressBase58: string;
  static readonly type: string = "base";

  constructor(senderAddressBase58: string, state: BaseContractStateAccessor) {
    this.senderAddressBase58 = senderAddressBase58;
    this.state = state;
  }

  validationError(message: string) {
    return new ValidationError(message);
  }
}

export class ValidationError implements Error {
  name: string;
  message: string;
  stack?: string;
  expected = true;

  constructor(message: string) {
    this.message = message;
  }

}
