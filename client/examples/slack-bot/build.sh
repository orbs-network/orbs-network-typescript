#!/bin/bash -e
yarn link orbs-interfaces
yarn link orbs-crypto-sdk

yarn install --production=false

yarn run build
