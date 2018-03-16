#!/bin/bash -xe

export DOCKER_TAG=$(./docker-tag.sh)

docker pull $DOCKER_IMAGE:$DOCKER_TAG
docker tag $DOCKER_IMAGE:$DOCKER_TAG orbs:$DOCKER_TAG
