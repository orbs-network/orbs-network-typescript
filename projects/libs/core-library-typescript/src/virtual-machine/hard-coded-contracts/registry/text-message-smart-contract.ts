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
    const message = await this.stateAccessor.load(this.getMessageKeyMask(account));
    return message != undefined ? [<Message>JSON.parse(message)] : [];
  }

  private async appendMessage(message: Message) {
    return this.stateAccessor.store(this.getMessageKey(message), JSON.stringify(message));
  }

  private getMessageKey(message: Message) {
    const hash = crypto.createHash("md5").update(JSON.stringify(message)).digest("hex");
    // TODO: add unique message haches and ask for all keys related to the recipient
    return `${this.getMessageKeyMask(message.recipient)}`;
  }

  private getMessageKeyMask(account: string) {
    return `messages.${account}`;
  }
}
