#!/bin/bash -e

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs-crypto-sdk}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}

docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
