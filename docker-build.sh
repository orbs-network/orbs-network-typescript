#!/bin/bash -e

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(./docker-tag.sh)}

docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} --build-arg CI=${CI} .
