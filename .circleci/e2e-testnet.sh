#!/bin/bash -xe

export DOCKER_TAG=$(./docker-tag.sh)

docker run --rm -ti \
    -e E2E_NO_DEPLOY=true \
    -e E2E_PUBLIC_API_ENDPOINT=$E2E_PUBLIC_API_ENDPOINT \
    $DOCKER_IMAGE:$DOCKER_TAG \
    bash -c "cd e2e && ./build.sh && ./test-from-host.sh"
