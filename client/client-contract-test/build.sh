#!/bin/bash -e

rm -rf deps && mkdir -p deps
ln -s "$(pwd)/../crypto-sdk" deps/crypto-sdk

yarn link orbs-client-sdk

yarn install

gradle acquireLibs

yarn run build

yarn test

yarn link
