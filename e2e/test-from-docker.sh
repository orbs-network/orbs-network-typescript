#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}
export TEST=${TEST-test}
export GENERATE_KEYS=${GENERATE_KEYS-true}
export NUM_OF_NODES=${NUM_OF_NODES-4}

export ROOT_DIR=$(cd "$(dirname "$0")/.."; pwd)

docker network create public-network --subnet 172.2.2.0/24 || true
docker run -ti --rm --privileged  \
--network=public-network --ip 172.2.2.15 \
-e PREEXISTING_PUBLIC_SUBNET=172.2.2 -e CONNECT_FROM_HOST=false \
-e CONSENSUS_ALGORITHM=pbft \
-e NUM_OF_NODES=$NUM_OF_NODES \
-e DOCKER_IMAGE=$DOCKER_IMAGE -e DOCKER_TAG=$DOCKER_TAG \
-e TEST=$TEST -e GENERATE_KEYS=$GENERATE_KEYS -e NUM_OF_NODES=$NUM_OF_NODES \
-v /var/run/docker.sock:/var/run/docker.sock \
-v $ROOT_DIR/logs:/opt/orbs/logs \
-v /opt/orbs/e2e/config/docker/private-keys/consensus/$NODE_NAME:/opt/orbs/private-keys/consensus/$NODE_NAME \
-v /opt/orbs/e2e/config/docker/public-keys/consensus:/opt/orbs/public-keys/consensus \
orbs:e2e \
bash -c "/opt/orbs/e2e/generate-nodes-keys.sh && yarn stress-test"

