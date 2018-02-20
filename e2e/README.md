# Orbs E2E Test Package

## What it does

This package loads an ad-hoc dockerized test environment and runs an end-to-end test against it.

### The Test Case

Bar is our test cryptocurrency represented through an hard-coded smart contract named FooBar.

The test case is a transfer of 1 bar token from one account to another.

* The test initializes accounts A and B with a number of Bars. Then, transfers Bars from account A to account B.
* After each stage, it eventually checks that the balances of the affected accounts have changed properly.
* Both the balance initialization and the transfer are done by sending a transaction to the network through a node (a sendTransaction() request), while the balance check is done by querying a trusted node for the balance (a call() request).

### The Test Environment

* `Orbs nodes` - run as separated dockers and connected through an `orbs-network` docker network.
* `Ganache server` - simulates an Ethereum node. Used for supporting the subscription validation of processed transactions. This simulation node is loaded with a stub Orbs Subscription contract that is pre-registered with a single Orbs Subscription Key, which all transactions are signed with. 

The test script connects to a Public API Service of one of the nodes through a `public-network` docker network.

## How to build it

run:

`./build.sh`

## How to run it

### Basic Usage

> If you wish to run it from your local environment, run:

`./test-from-host.sh`

> If you wish to run it inside a docker, run:

`./test-from-docker.sh`

### Advanced Usage

The test can be run directly via `yarn test`

The following parameters (passed as environment variables) are supported:
- CONNECT_FROM_HOST - Set to *true* if you run it directly from the docker host. Otherwise, if run from inside a docker, set to *false*.
- E2E_NO_DEPLOY - Set to *true* if you wish to run the e2e test on a pre-deployed environment.
- E2E_PUBLIC_API_ENDPOINT - The address of the node Public API to connect to (Ignored if E2E_NO_DEPLOY = false).
