#!/bin/bash -e

mkdir -p deps/
ln -sf $(realpath ../crypto-sdk) deps/crypto-sdk

yarn install

yarn run build
