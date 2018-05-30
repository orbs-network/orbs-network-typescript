import BaseSmartContract from "../base-smart-contact";

export default class EventCounterContract extends BaseSmartContract {
  public async reportEvent(event: string) {
    const value: number = await this.getValue(event);
    await this.setValue(event, value + 1);
  }

  public async getCounter(event: string) {
    return this.getValue(event);
  }

  private async getValue(event: string) {
    const value = await this.state.load(this.getStorageKey(event));
    return value != undefined ? JSON.parse(value) : 0;
  }

  private async setValue(event: string, amount: number) {
    return this.state.store(this.getStorageKey(event), JSON.stringify(amount));
  }

  private getStorageKey(event: string) {
    return `values.${this.senderAddressBase58}.${event}`;
  }
}
