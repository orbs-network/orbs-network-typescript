#!/bin/bash -e

pushd ../crypto-sdk/
pwd
./configure.sh
./build.sh
popd

yarn install

yarn run build

yarn test
