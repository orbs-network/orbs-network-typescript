#!/bin/bash -e

yarn link orbs-interfaces
yarn link orbs-core-library

yarn install

yarn run build

echo "Copy mock server from client-sdk-javascript to run contract test..."
cp ../../../client/client-sdk-javascript/src/orbs-api-interface.ts src
cp ../../../client/client-sdk-javascript/test/mock-server.ts test

yarn test

export EXIT_CODE=$?

rm src/orbs-api-interface.ts

exit $EXIT_CODE
