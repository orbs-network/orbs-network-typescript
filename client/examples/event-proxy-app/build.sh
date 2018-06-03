#!/bin/bash -e
yarn link orbs-client-sdk

yarn install --production=false

yarn run build
