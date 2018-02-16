#!/bin/bash -xe

docker network create public-network --subnet 172.2.2.0/24 || true
docker run -ti --rm --privileged  --network=public-network --ip 172.2.2.15 -e PREEXISTING_PUBLIC_SUBNET=172.2.2 -e CONNECT_FROM_HOST=false -e DOCKER_IMAGE -e DOCKER_TAG -v /var/run/docker.sock:/var/run/docker.sock $DOCKER_IMAGE:$DOCKER_TAG  bash -c 'apk add --no-cache docker py-pip && pip install docker-compose && cd e2e && ./build.sh && yarn test'
