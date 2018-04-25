#!/bin/bash

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(./docker-tag.sh)}

mkdir -p docker/images

docker image save $DOCKER_IMAGE:$DOCKER_TAG -o docker/images/orbs-network.tar
echo DOCKER_IMAGE=$DOCKER_IMAGE DOCKER_TAG=$DOCKER_TAG > docker/images/.env
