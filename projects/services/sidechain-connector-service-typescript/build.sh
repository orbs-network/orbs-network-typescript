#!/bin/bash -e

yarn link orbs-common-library
yarn link orbs-sidechain-connector-library

yarn install

yarn run build
