#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}
export TEST=${TEST-test}

if ${GENERATE_KEYS}
then
    echo 'Generating Keys'
    END=${NUM_OF_NODES} ./generate-nodes-keys.sh
fi

yarn run build
CONNECT_FROM_HOST=true yarn run $TEST
