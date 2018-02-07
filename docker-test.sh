#!/bin/bash -x

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}
export NODE_CONFIG_PATH=/opt/orbs/config/topology

# environment setup
docker network create orbs-network --subnet 172.2.1.0/24
PUBLIC_API_EXTERNAL_PORT=12345 PRIVATE_NETWORK=172.100.1 NODE_NAME=node1 NODE_IP=172.2.1.2 docker-compose -p orbs-node1 -f docker-compose.test.services.yml up -d
PUBLIC_API_EXTERNAL_PORT=12346 PRIVATE_NETWORK=172.100.2 NODE_NAME=node2 NODE_IP=172.2.1.3 docker-compose -p orbs-node2 -f docker-compose.test.services.yml up -d
PUBLIC_API_EXTERNAL_PORT=12347 PRIVATE_NETWORK=172.100.3 NODE_NAME=node3 NODE_IP=172.2.1.4 docker-compose -p orbs-node3 -f docker-compose.test.services.yml up -d
PUBLIC_API_EXTERNAL_PORT=12348 PRIVATE_NETWORK=172.100.4 NODE_NAME=node4 NODE_IP=172.2.1.5 docker-compose -p orbs-node4 -f docker-compose.test.services.yml up -d
PUBLIC_API_EXTERNAL_PORT=12349 PRIVATE_NETWORK=172.100.5 NODE_NAME=node5 NODE_IP=172.2.1.6 docker-compose -p orbs-node5 -f docker-compose.test.services.yml up -d
PUBLIC_API_EXTERNAL_PORT=12350 PRIVATE_NETWORK=172.100.6 NODE_NAME=node6 NODE_IP=172.2.1.7 docker-compose -p orbs-node6 -f docker-compose.test.services.yml up -d

sleep ${STARTUP_WAITING_TIME-30}

# run e2e test
cd ./e2e && E2E_NO_DEPLOY=true E2E_PUBLIC_API_ENDPOINT=0.0.0.0:12345 npm test
cd ..
export EXIT_CODE=$?

# cleanup
PUBLIC_API_EXTERNAL_PORT=12345 PRIVATE_NETWORK=172.100.1 NODE_NAME=node1 NODE_IP=172.2.1.2 docker-compose -p orbs-node1 -f docker-compose.test.services.yml down
PUBLIC_API_EXTERNAL_PORT=12346 PRIVATE_NETWORK=172.100.2 NODE_NAME=node2 NODE_IP=172.2.1.3 docker-compose -p orbs-node2 -f docker-compose.test.services.yml down
PUBLIC_API_EXTERNAL_PORT=12347 PRIVATE_NETWORK=172.100.3 NODE_NAME=node3 NODE_IP=172.2.1.4 docker-compose -p orbs-node3 -f docker-compose.test.services.yml down
PUBLIC_API_EXTERNAL_PORT=12348 PRIVATE_NETWORK=172.100.4 NODE_NAME=node4 NODE_IP=172.2.1.5 docker-compose -p orbs-node4 -f docker-compose.test.services.yml down
PUBLIC_API_EXTERNAL_PORT=12349 PRIVATE_NETWORK=172.100.5 NODE_NAME=node5 NODE_IP=172.2.1.6 docker-compose -p orbs-node5 -f docker-compose.test.services.yml down
PUBLIC_API_EXTERNAL_PORT=12350 PRIVATE_NETWORK=172.100.6 NODE_NAME=node6 NODE_IP=172.2.1.7 docker-compose -p orbs-node6 -f docker-compose.test.services.yml down


exit $EXIT_CODE
