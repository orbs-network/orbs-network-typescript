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

docker network create public-api-external-network --subnet 172.2.2.0/24 || true
docker run -ti --rm --privileged  --network=public-api-external-network --ip 172.2.2.9 -e PREEXISTING_PUBLIC_API_SUBNET=172.2.2 -e CONNECT_FROM_HOST=false -e DOCKER_IMAGE -e DOCKER_TAG -v /Users/idan/dev/orbs/orbs-network/e2e/src:/opt/orbs/e2e/src -v /var/run/docker.sock:/var/run/docker.sock $DOCKER_IMAGE:$DOCKER_TAG  bash -c 'apk add --no-cache docker py-pip && pip install docker-compose && cd e2e && ./build.sh && ./test.sh'

exit $EXIT_CODE
