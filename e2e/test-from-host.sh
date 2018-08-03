#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}
export TEST=${TEST-test}
export GENERATE_KEYS=${GENERATE_KEYS-true}
export NUM_OF_NODES=${NUM_OF_NODES-4}

yarn install
yarn run build

if [ "$GENERATE_KEYS" = true ] ;
then
    echo 'Generating Keys'
    NUM_OF_NODES=${NUM_OF_NODES} ./generate-nodes-keys.sh
fi

CONNECT_FROM_HOST=true yarn run $TEST
