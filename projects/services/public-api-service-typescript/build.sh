#!/bin/bash -e

yarn link orbs-interfaces
yarn link orbs-core-library

yarn install

yarn run build

echo "Copy orbs-api-interface from contract test..."
cp ../../../client/client-contract-test/src/orbs-api-interface.ts src

yarn test
