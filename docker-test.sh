#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}

function run_tests() {
    echo "RUNNING SERVICE TESTS FOR $1"
    docker run --rm -ti \
        -w /opt/orbs/$1 \
        $DOCKER_IMAGE:$DOCKER_TAG yarn test

    export EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ] ; then
        echo "FAILED SERVICE TESTS FOR $1"
        exit $EXIT_CODE
    fi
}

run_tests ./projects/libs/core-library-typescript

for D in `find ./projects/services -type d ! -name node_modules -maxdepth 1 -mindepth 1`; do
    run_tests "$D"
done

./e2e/test-from-docker.sh

exit $EXIT_CODE
