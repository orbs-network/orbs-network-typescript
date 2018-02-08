#!/bin/bash -xe

export DOCKER_IMAGE=${DOCKER_IMAGE-orbs}
export DOCKER_TAG=${DOCKER_TAG-$(git rev-parse --abbrev-ref HEAD | sed -e 's/\//-/g')}

function generate_dockerfile {
    cat docker-compose.test.yml \
    | sed -e "s/_NODE_NAME_/${NODE_NAME}/g" \
    | sed -e "s/_NODE_IP_/${NODE_IP}/g" \
    | sed -e "s/_PRIVATE_NETWORK_/${PRIVATE_NETWORK}/g" \
      > docker-compose.test.yml.tmp.${NODE_NAME}
}

export PRIVATE_NETWORK=172.100.1
export NODE_NAME=bliny
export NODE_IP=172.2.1.2

generate_dockerfile

export PRIVATE_NETWORK=172.110.1
export NODE_NAME=pelmeni
export NODE_IP=172.2.1.3

generate_dockerfile

export PRIVATE_NETWORK=172.120.1
export NODE_NAME=borscht
export NODE_IP=172.2.1.4

generate_dockerfile

export PRIVATE_NETWORK=172.130.1
export NODE_NAME=pirogi
export NODE_IP=172.2.1.5

generate_dockerfile

export PRIVATE_NETWORK=172.140.1
export NODE_NAME=oladyi
export NODE_IP=172.2.1.6

generate_dockerfile

export PRIVATE_NETWORK=172.150.1
export NODE_NAME=olivier
export NODE_IP=172.2.1.7

generate_dockerfile

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

export UP_D=restart

export DOCKER_COMPOSE=`cat <<EOF
docker-compose -p orbsnetwork \
        -f docker-compose.test.network.yml \
        -f $VOLUMES \
        -f docker-compose.test.yml.tmp.bliny \
        -f docker-compose.test.yml.tmp.pelmeni \
        -f docker-compose.test.yml.tmp.borscht \
        -f docker-compose.test.yml.tmp.pirogi \
        -f docker-compose.test.yml.tmp.oladyi \
        -f docker-compose.test.yml.tmp.olivier
EOF`

function start() {
    $($DOCKER_COMPOSE up -d $FORCE_RECREATE_ARGUMENT)
}

function restart() {
    $($DOCKER_COMPOSE restart)
}

if [ -z "$STAY_UP" ]; then
    start
else
    if ! restart ; then
        start
    fi
fi


sleep ${STARTUP_WAITING_TIME-30}

docker exec -ti orbsnetwork_public-api-pelmeni_1 bash -c "cd /opt/orbs/e2e/ && npm test"
export EXIT_CODE=$?

docker ps -a --no-trunc > logs/docker-ps

if [ -z "$STAY_UP" ] ; then
    $($DOCKER_COMPOSE stop)
fi

exit $EXIT_CODE
