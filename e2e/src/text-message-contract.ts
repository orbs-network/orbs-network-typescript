/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { OrbsContract } from "orbs-client-sdk";

export interface Message {
  recipient: string;
  sender: string;
  timestamp: number;
  processedAtTimestamp: number;
  message: string;
}

export class TextMessageAccount {
  adapter: OrbsContract;
  address: string;

  public constructor(address: string, adapter: OrbsContract) {
    this.adapter = adapter;
    this.address = address;
  }

  public async sendMessage(recipient: string, message: string) {
    return await this.adapter.sendTransaction("sendMessage", [recipient, message, new Date().getTime()]);
  }

  public async getMyMessages() {
    return this.adapter.call("getMyMessages", []);
  }
}
