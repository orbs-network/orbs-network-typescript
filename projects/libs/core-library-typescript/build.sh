#!/bin/bash -e

yarn link orbs-interfaces

yarn install --unsafe-perm grpc@1.9.0 # Needs unsafe permissions to install node grpc extensions
yarn install

yarn run build

yarn test

yarn link
