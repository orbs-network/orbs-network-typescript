/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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
