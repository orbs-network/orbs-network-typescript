#!/bin/bash -e

yarn link orbs-interfaces
yarn link orbs-common-library
yarn link orbs-block-storage-library

yarn install

yarn run build

yarn link
