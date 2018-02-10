#!/bin/bash -e

yarn link orbs-interfaces
yarn link orbs-common-library
yarn link orbs-consensus-library
yarn link orbs-gossip-library
yarn link orbs-transaction-pool-library
yarn link orbs-subscription-manager-library

yarn install

yarn run build
