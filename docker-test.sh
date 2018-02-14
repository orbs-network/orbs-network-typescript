#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}
export NODE_CONFIG_PATH=/opt/orbs/config/topology
export GOSSIP_PEERS=ws://172.2.1.2:60001,ws://172.2.1.3:60001,ws://172.2.1.4:60001,ws://172.2.1.5:60001,ws://172.2.1.6:60001,ws://172.2.1.7:60001

echo "RUNNING UNIT TESTS"
docker run --rm -ti \
    -w /opt/orbs/projects/libs/core-library-typescript \
    $DOCKER_IMAGE:$DOCKER_TAG yarn test
echo EXIT_CODE=$?

if [[ $EXIT_CODE != 0 ]] ; then
    echo "FAILED UNIT TESTS"
    exit $EXIT_CODE
fi

if [ -z "$LOCAL" ]; then
    export VOLUMES=docker-compose.test.volumes.yml
else
    export VOLUMES=docker-compose.test.volumes.local.yml
fi

if [ -z "$FORCE_RECREATE" ]; then
    export FORCE_RECREATE_ARGUMENT=""
else
    export FORCE_RECREATE_ARGUMENT="--force-recreate"
fi

function start_node() {
    PUBLIC_API_HOST_PORT=$1 PRIVATE_NETWORK=$5 NODE_NAME=$2 NODE_IP=$3 PUBLIC_API_IP=$4 docker-compose -p orbs-$2 -f $VOLUMES -f docker-compose.test.networks.yml -f docker-compose.test.services.yml up -d $FORCE_RECREATE_ARGUMENT
}

function stop_node() {
    PUBLIC_API_HOST_PORT=$1 PRIVATE_NETWORK=$5 NODE_NAME=$2 NODE_IP=$3 PUBLIC_API_IP=$4 docker-compose -p orbs-$2 -f $VOLUMES -f docker-compose.test.networks.yml -f docker-compose.test.services.yml down
}

function run_e2e_test() {
    E2E_CLIENT_IP=$1 E2E_NO_DEPLOY=true PUBLIC_API_IP=$2 docker-compose -p orbs-e2e -f docker-compose.test.volumes.local.yml -f docker-compose.test.networks.yml -f docker-compose.test.e2e.yml run --rm e2e
}

export UP_D=restart


# environment setup

function start_test_environment() {
    stop_test_environment || true
    docker network create orbs-network --subnet 172.2.1.0/24
    docker network create public-api-external-network --subnet 172.2.2.0/24
    start_node 12345 node1 172.2.1.2 172.2.2.2 172.100.1 &
    start_node 12346 node2 172.2.1.3 172.2.2.3 172.100.2 &
    start_node 12347 node3 172.2.1.4 172.2.2.4 172.100.3 &
    start_node 12348 node4 172.2.1.5 172.2.2.5 172.100.4 &
    start_node 12349 node5 172.2.1.6 172.2.2.6 172.100.5 &
    start_node 12350 node6 172.2.1.7 172.2.2.7 172.100.6 &
    wait
}

function stop_test_environment() {
    stop_node 12345 node1 172.2.1.2 172.2.2.2 172.100.1 &
    stop_node 12346 node2 172.2.1.3 172.2.2.3 172.100.2 &
    stop_node 12347 node3 172.2.1.4 172.2.2.4 172.100.3 &
    stop_node 12348 node4 172.2.1.5 172.2.2.5 172.100.4 &
    stop_node 12349 node5 172.2.1.6 172.2.2.6 172.100.5 &
    stop_node 12350 node6 172.2.1.7 172.2.2.7 172.100.6 &
    wait
    docker network rm public-api-external-network  
    docker network rm orbs-network    
}

if [ -z "$STAY_UP" ]; then
    start_test_environment
else
    if ! restart ; then
        start_stop_environment
    fi
fi

sleep ${STARTUP_WAITING_TIME-30}
run_e2e_test 172.2.2.9 172.2.2.4
export EXIT_CODE=$?
docker ps -a --no-trunc > logs/docker-ps

if [ -z "$STAY_UP" ] ; then
    stop_test_environment
fi
exit $EXIT_CODE
