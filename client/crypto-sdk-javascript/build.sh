#!/bin/bash -e

rm -rf deps && mkdir -p deps
ln -s "$(pwd)/../crypto-sdk" deps/crypto-sdk

yarn install

yarn run build
