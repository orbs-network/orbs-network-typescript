#!/bin/bash -e

yarn link orbs-client-sdk

yarn install

gradle --stop
gradle acquireLibs

yarn run build

yarn test

yarn link
