#!/bin/bash -e

yarn link orbs-interfaces
yarn link orbs-common-library
yarn link orbs-gossip-library

yarn install

yarn run build

yarn link
