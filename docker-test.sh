#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}
export NODE_CONFIG_PATH=/opt/orbs/config/topology
export GOSSIP_PEERS=ws://172.2.1.2:60001,ws://172.2.1.3:60001,ws://172.2.1.4:60001,ws://172.2.1.5:60001,ws://172.2.1.6:60001,ws://172.2.1.7:60001


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
    PUBLIC_API_EXTERNAL_PORT=$1 PRIVATE_NETWORK=$4 NODE_NAME=$2 NODE_IP=$3 docker-compose -p orbs-$2 -f $VOLUMES -f docker-compose.test.yml up -d $FORCE_RECREATE_ARGUMENT
}

function stop_node() {
    PUBLIC_API_EXTERNAL_PORT=$1 PRIVATE_NETWORK=$4 NODE_NAME=$2 NODE_IP=$3 docker-compose -p orbs-$2 -f $VOLUMES -f docker-compose.test.yml down
}


export UP_D=restart


# environment setup

function start() {
    docker network create orbs-network --subnet 172.2.1.0/24
    start_node 12345 node1 172.2.1.2 172.100.1 &
    start_node 12346 node2 172.2.1.3 172.100.2 &
    start_node 12347 node3 172.2.1.4 172.100.3 &
    start_node 12348 node4 172.2.1.5 172.100.4 &
    start_node 12349 node5 172.2.1.6 172.100.5 &
    start_node 12350 node6 172.2.1.7 172.100.6 &
    wait
}

function stop() {
    stop_node 12345 node1 172.2.1.2 172.100.1 &
    stop_node 12346 node2 172.2.1.3 172.100.2 &
    stop_node 12347 node3 172.2.1.4 172.100.3 &
    stop_node 12348 node4 172.2.1.5 172.100.4 &
    stop_node 12349 node5 172.2.1.6 172.100.5 &
    stop_node 12350 node6 172.2.1.7 172.100.6 &
    wait
    docker network rm orbs-network    
}

if [ -z "$STAY_UP" ]; then
    start
else
    if ! restart ; then
        start
    fi
fi
sleep ${STARTUP_WAITING_TIME-30}
cd ./e2e && npm install && E2E_NO_DEPLOY=true E2E_PUBLIC_API_ENDPOINT=0.0.0.0:12347 npm test && cd ..
export EXIT_CODE=$?

if [ -z "$STAY_UP" ] ; then
    stop
fi
exit $EXIT_CODE
