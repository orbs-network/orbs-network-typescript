#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}
export TEST=${TEST-test}

export ROOT_DIR=$(cd "$(dirname "$0")/.."; pwd)

docker network create public-network --subnet 172.2.2.0/24 || true
docker run -ti --rm --privileged  \
--network=public-network --ip 172.2.2.15 \
-e PREEXISTING_PUBLIC_SUBNET=172.2.2 -e CONNECT_FROM_HOST=false \
-e DOCKER_IMAGE -e DOCKER_TAG \
-e TEST \
-v /var/run/docker.sock:/var/run/docker.sock \
-v $ROOT_DIR/logs:/opt/orbs/logs \
orbs:e2e  \
yarn test
