#!/bin/bash -e

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(./docker-tag.sh)}
export DOCKER_BUILD_OPTIONS=${DOCKER_BUILD_OPTIONS-""}
# --squash to produce a single layer image

docker build $DOCKER_BUILD_OPTIONS -f Dockerfile.server -t ${DOCKER_IMAGE}:${DOCKER_TAG} --build-arg CI=${CI} .
