#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}

echo "RUNNING UNIT TESTS"
docker run --rm -ti \
    -w /opt/orbs/projects/libs/core-library-typescript \
    $DOCKER_IMAGE:$DOCKER_TAG yarn test

export EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ] ; then
    echo "FAILED UNIT TESTS"
    exit $EXIT_CODE
fi

./e2e/test-from-docker.sh

exit $EXIT_CODE
