#!/bin/bash -xe

cd deploy
npm install

aws s3 sync s3://orbs-network-config-staging/dummy-keys/public-keys/ bootstrap/public-keys/
aws s3 sync s3://orbs-network-config-staging/dummy-keys/private-keys/ temp-keys/private-keys/
./deploy-staging.sh
