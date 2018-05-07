#!/bin/bash -e

yarn link orbs-interfaces
yarn link orbs-core-library

yarn install

yarn run build

yarn test

export EXIT_CODE=$?

rm src/orbs-api-interface.ts

exit $EXIT_CODE
