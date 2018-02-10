#!/bin/bash -e

yarn link orbs-common-library

yarn install

yarn run build

yarn test

yarn link
