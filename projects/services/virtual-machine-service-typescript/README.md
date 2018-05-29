# Virtual Machine Service

## Overview

The Virtual Machine Service is responsible for processing transactions against smart contracts.
Currently, the only supported contracts are hard-coded, meaning contracts that are registered at deploy-time.

The service provides two primary methods:

- `processTransactionSet()` - Processes a set of transactions, executes them against their smart contracts and returns the state changes. The method is used by the consensus service in order to process the next block and achieve consensus on the state changes between all nodes.
- `callContract()` - Instant call to a contract method. (_Note: This method doesn't modify the state_).

## Development & deployment of a smart contract

### Step 1: Development

An hard-coded smart contract is implemented as a Typescript class that inherits BaseSmartContract abstract class.
Every time a contract is called, a new instance of the class is created and is loaded with a couple of variable members: `state` and `senderAddressBase58`.

- `state` object is used for loading and modifying the state of a smart contract. It exports the following methods:
  - `load(variableName)` - returns the value of a stored state variable
  - `store(variableName, value)`- modifies the value of a stored state variable. _Note that the state is not modified directly by this method but only eventually, upon consensus of multiple nodes, and only once the block that contains the processed transaction is committed_.
- `senderAddressBase58` is the Base58 representation of the address that called the contract.

The following code is an example of a smart contract that implements a transferrable token:

```javascript
import BaseSmartContract from "../base-smart-contact";

export default class SimpleTokenContract extends BaseSmartContract {
  static readonly SUPERUSER_ADDRESS_BASE58 = "SUPERUSER_ADDRESS_PLACEHOLDER";

  public async transfer(recipient: string, amount: number) {
    if (amount === 0) {
      throw this.validationError("transaction amount must be > 0");
    }

    const senderBalance: number = await this.getBalance(this.senderAddressBase58);
    if (senderBalance < amount) {
      throw this.validationError(`balance is not sufficient ${senderBalance} < ${amount}`);
    }

    const recipientBalance: number = await this.getBalance(recipient);

    await this.setBalance(this.senderAddressBase58, senderBalance - amount);
    await this.setBalance(recipient, recipientBalance + amount);
  }

  public async initBalance(account: string, amount: number) {
    if (this.senderAddressBase58 === SUPERUSER_ADDRESS_BASE58) {
        this.setBalance(account, amount);
    } else {
        throw this.validationError("Only a superuser is allowed to init balance of an account");
    }
  }

  private async getBalance(account: string) {
    const balance = await this.state.load(this.getAccountBalanceKey(account));
    return balance != undefined ? JSON.parse(balance) : 0;
  }

  private async setBalance(account: string, amount: number) {
    return this.state.store(this.getAccountBalanceKey(account), JSON.stringify(amount));
  }

  private getAccountBalanceKey(account: string) {
    return `balances.${account}`;
  }
}
```

This contract holds and manages account balances, stored and accessible through `this.state` object.
`transfer()` and `initBalance()` methods modify account balances, whereas `getBalance()` only reads them. Methods that modify the state should be called only through transaction processing ( `processTransactionSet()` ), otherwise the state modification operation fails.

### Step 2: Registration

A smart contract class, in order to be accessible by the virtual machine, should be:

1. Implemented inside a module under the registry folder ( _/projects/libs/core-library-typescript/src/virtual-machine/hard-coded-contracts/registry_ ).
2. Defined as the default export of the module.

Then, the smart contact module should be added to the list of smart contracts to load, through `SMART_CONTRACTS_TO_LOAD` configuration variable.
Check the [deployment configuration instructions](../../../deploy/bootstrap/README.md) for more details.


### Step 3: Deployment

In order to for your smart contract to be usable, it must be deployed across all nodes in the network. The way to do it is to create a pull request. Once the pull request is approved and merged, all you have to do is pray and wait for all nodes to deploy the new version that includes your contract.
