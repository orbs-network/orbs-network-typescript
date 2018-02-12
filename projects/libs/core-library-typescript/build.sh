#!/bin/bash -e

yarn link orbs-interfaces

yarn install --unsafe-perm grpc@1.9.0 # Needs unsafe permissions to install node grpc extensions
yarn install

yarn run build

# Please restore after removing the circular dependency between the libraries and the services.
# yarn test

yarn link
