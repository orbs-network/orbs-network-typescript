/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import BaseSmartContract from "../base-smart-contact";
import * as crypto from "crypto";

export interface Message {
  recipient: string;
  sender: string;
  timestamp: number;
  processedAtTimestamp: number;
  message: string;
}

export default class TextMessageSmartContract extends BaseSmartContract {
  public async sendMessage(recipient: string, message: string, timestamp: number) {
    if (message.length === 0) {
      throw new Error("Message should not be empty");
    }

    const processedAtTimestamp = new Date().getTime();

    if (timestamp > processedAtTimestamp) {
      throw new Error("Message can not be from the future");
    }

    await this.appendMessage({
      recipient,
      sender: this.senderAddressBase58,
      timestamp,
      processedAtTimestamp,
      message
    });
  }

  public async getMyMessages(): Promise<Message[]> {
    return this.getMessages(this.senderAddressBase58);
  }

  private async getMessages(account: string): Promise<Message[]> {
    const messages = await this.state.load(this.getMessageKey(account));
    return messages != undefined ? JSON.parse(messages) : [];
  }

  private async appendMessage(message: Message) {
    const messages = await this.getMessages(message.recipient);
    messages.push(message);

    return this.state.store(this.getMessageKey(message.recipient), JSON.stringify(messages));
  }

  private getMessageKey(account: string) {
    return `messages.${account}`;
  }
}
