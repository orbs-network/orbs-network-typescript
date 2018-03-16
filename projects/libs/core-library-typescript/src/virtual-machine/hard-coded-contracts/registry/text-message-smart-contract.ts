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
      sender: this.sender,
      timestamp,
      processedAtTimestamp,
      message
    });
  }

  public async getMyMessages(): Promise<Message[]> {
    return this.getMessages(this.sender);
  }

  private async getMessages(account: string): Promise<Message[]> {
    const messages = await this.stateAccessor.load(this.getMessageKey(account));
    return messages != undefined ? JSON.parse(messages) : [];
  }

  private async appendMessage(message: Message) {
    const messages = await this.getMessages(message.recipient);
    messages.push(message);

    return this.stateAccessor.store(this.getMessageKey(message.recipient), JSON.stringify(messages));
  }

  private getMessageKey(account: string) {
    return `messages.${account}`;
  }
}
