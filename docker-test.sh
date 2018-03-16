#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(./docker-tag.sh)}

./e2e/test-from-docker.sh

exit $EXIT_CODE
