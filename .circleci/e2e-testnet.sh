#!/bin/bash -xe

docker run --rm -ti \
    -e E2E_NO_DEPLOY=true \
    -e E2E_PUBLIC_API_ENDPOINT=$E2E_PUBLIC_API_ENDPOINT \
    orbs:e2e \
    ./test-from-host.sh
