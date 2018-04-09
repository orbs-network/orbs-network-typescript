#!/bin/bash -e

yarn link orbs-interfaces
yarn link orbs-crypto-sdk
yarn install

yarn run build

yarn test

yarn link
