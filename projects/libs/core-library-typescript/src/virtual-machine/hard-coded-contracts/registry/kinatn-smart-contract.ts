import BaseSmartContract from "../base-smart-contact";

export default class KinAtnSmartContract extends BaseSmartContract {
  static readonly ALLOCATED_POOL_STATE_VARIABLE = "atn_pool";
  static readonly ONE_MILLION = 1_000_000;
  static readonly ONE_BILLION = KinAtnSmartContract.ONE_MILLION * 1000;
  static readonly DEFAULT_BALANCE = 10000;
  static readonly POOL_INITIAL_VALUE = KinAtnSmartContract.ONE_BILLION * 20;

  public async transfer(recipient: string, amount: number) {
    if (typeof recipient != "string") {
      throw this.validationError("Argument recipient must be a string");
    }

    if (typeof amount != "number") {
      throw this.validationError("Argument amount must be a number");
    }

    if (amount <= 0) {
      throw this.validationError("Transaction amount must be > 0");
    }

    const senderBalance: number = await this.getBalanceForAccount(this.senderAddressBase58);

    if (senderBalance < amount) {
      throw this.validationError(`Insufficient balance ${senderBalance} < ${amount}`);
    }

    const recipientBalance: number = await this.getBalanceForAccount(recipient);

    if (recipientBalance > (Number.MAX_SAFE_INTEGER - amount)) {
      throw this.validationError(`Recipient account of ${recipient} is at balance ${recipientBalance} and will overflow if ${amount} is added`);
    }

    await this.setBalance(this.senderAddressBase58, senderBalance - amount);
    await this.setBalance(recipient, recipientBalance + amount);
  }

  public async getBalance() {
    return this.getBalanceForAccount(this.senderAddressBase58);
  }

  private async reduceFromPool(amount: number) {
    let allocatedBalance = await this.getPoolBalance();
    if (allocatedBalance == 0) {
      // reset/init the pool
      await this.setPoolBalance(KinAtnSmartContract.POOL_INITIAL_VALUE);
      allocatedBalance = await this.getPoolBalance();
    }
    await this.setPoolBalance(allocatedBalance - amount);
  }

  public async financeAccount(accountToFinance: string): Promise<number> {
    if (typeof accountToFinance != "string") {
      throw this.validationError("Argument accountToFinance must be a string");
    }

    await this.setBalance(accountToFinance, KinAtnSmartContract.DEFAULT_BALANCE);
    await this.reduceFromPool(KinAtnSmartContract.DEFAULT_BALANCE);

    return KinAtnSmartContract.DEFAULT_BALANCE;
  }

  private async getBalanceForAccount(account: string): Promise<number> {
    const balance = await this.state.load(this.getAccountBalanceKey(account));
    return balance != undefined ? JSON.parse(balance) : 0;
  }

  private async setBalance(account: string, amount: number) {
    this.state.store(this.getAccountBalanceKey(account), JSON.stringify(amount));
  }

  private async getPoolBalance() {
    const balance = await this.state.load(KinAtnSmartContract.ALLOCATED_POOL_STATE_VARIABLE);
    return balance != undefined ? JSON.parse(balance) : 0;
  }

  private async setPoolBalance(amount: number) {
    this.state.store(KinAtnSmartContract.ALLOCATED_POOL_STATE_VARIABLE, JSON.stringify(amount));
  }

  private getAccountBalanceKey(account: string) {
    return `balances.${account}`;
  }
}
