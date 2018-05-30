# Orbs E2E Test Package

## What it does

This package loads an ad-hoc dockerized test environment and runs an end-to-end test against it.

## The Test Case

BAR is our test cryptocurrency represented through an hard-coded smart contract named FooBar.

The test case is a transfer of 1 BAR token from one account to another.

* The test initializes accounts A and B with a number of BARs. Then, transfers BARs from account A to account B.
* After each stage, it eventually checks that the balances of the affected accounts have changed properly.
* Both the balance initialization and the transfer are done by sending a transaction to the network through a node (a sendTransaction() request), while the balance check is done by querying a trusted node for the balance (a call() request).

## The Test Environment

* `Orbs nodes` - run as separate docker containers which are connected through an `orbs-network` docker network.
* `Ganache server` - simulates an Ethereum node. Used for supporting the subscription validation of processed transactions. This simulation node is loaded with a stub Orbs Subscription contract that is pre-registered with a single Orbs Subscription Key, which all transactions are signed with.

The test script connects to a Public API Service of one of the nodes through a `public-network` docker network.

## How to build it

### Node build (Node=Server)
First run `./docker/build-server-base.sh`, which should not take a long time to complete.
* This builds _orbs:base-server_ from Dockerfile.server.base, there is no reason to rebuild this image after it is created unless the typescript version changes.

Next, run `./docker-build.sh`, this will take several minutes to compelete
* This builds _orbs:[branch_name]_ from Dockerfile.server. It runs a full server build. This is the docker Node image (with all services). It uses the _orbs:base-server_ image. *Every time* you change the logic of one of the server code components (anything under `./projects`) you need to rebuild this for e2e tests.

### Client SDK build
First run `./docker/build-sdk-base.sh`, this may take several minutes to complete
* This builds _orbs:base-sdk_ image from Dockerfile.sdk.base. It contains the android SDK and some other base components for our client SDKs, and should not be rebuilt unless one of these change.

Next, run `./docker/build-sdk.sh`, this may also take several minutes to complete.
* This builds _orbs:sdk_ image from Dockerfile.sdk. It uses the _orbs:base-sdk_ image. You will need to rebuild this image if the client code changes. The e2e uses the typescript client.

### E2E build
This build relies on _orbs:base-sdk_ image built above, so you must first run `./docker/build-sdk.sh` if you havn't done so yet.

Once the base-sdk image is ready, run `./docker/build-e2e.sh`, which is going to take some time to complete as well.
* This builds _orbs:e2e_ image from Dockerfile.e2e. As explained it is uses the image _orbs:base-sdk_. You will need to rebuild it if any e2e code is changed, or if the client sdk (typescript) is changed.

## How to run it

Running the e2e tests will use the docker images built above. The code that will be used for running will be the one included in the docker images, and the nodes used for testing are containers of these images.

### Basic Usage

If you wish to run it from your local environment, run:

`./test-from-host.sh`

This will not require you to build the docker e2e image, this is mostly useful when you are changing the e2e code.

If you wish to run it inside a docker, run the below, which will use the e2e docker image to run the tests:

`./test-from-docker.sh`

> IMPORTANT: If you encounter e2e errors on CircleCI when you push code, run `test-from-docker.sh` locally to try to reproduce the errors. This is what CircleCI runs during build.
Note that it runs slower than `test-from-host.sh`.


### Advanced Usage

The test can be run directly via `yarn test`

The following parameters (passed as environment variables) are supported:
- CONNECT_FROM_HOST - Set to *true* if you run it directly from the docker host. Otherwise, if run from inside a docker, set to *false*.
- E2E_NO_DEPLOY - Set to *true* if you wish to run the e2e test on a pre-deployed environment.
- E2E_PUBLIC_API_ENDPOINT - The address of the node Public API to connect to (Ignored if E2E_NO_DEPLOY = false).

### Stress test

Can run with `yarn run stress-test` or `API_ENDPOINT=http://localhost:30003 TEST=stress-test ./test-from-host.sh`. Takes a parameter `E2E_ACCOUNTS_TOTAL` (default: `10`).

This number of accounts will be initialized and then transfers between them will be initiated in certain order: from N to N+1 and in case of N+1 to 0.

### Stub consensus tests

To enable the stub consensus instead of the default one, you need a couple of additional environment variables on nodes. You can pass additional variables using an additional `ENV_FILE=stub-consensus.env` environment variable on your machine, which pulls the variables from `/e2e/config/env/=stub-consensus.env`.

To run the basic test run `ENV_FILE=stub-consensus.env ./test-from-host.sh`

To run a stress test run `ENV_FILE=stub-consensus.env TEST=stress-test ./test-from-host.sh`

## Development

When you make changes to the codebase, don't forget to run `./docker-build.sh` to create fresh docker images for the e2e.

If you get connection problems due to lingering docker connections, run `docker rm -f $(docker ps -a -q)`
