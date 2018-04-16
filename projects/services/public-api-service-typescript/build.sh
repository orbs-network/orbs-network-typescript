#!/bin/bash -e

yarn link orbs-interfaces
yarn link orbs-core-library

yarn install

yarn run build

echo "Copy mock server from client-sdk-javascript to run contract test..."
cp ../../../client/client-sdk-javascript/test/mock-server.ts test

yarn test
