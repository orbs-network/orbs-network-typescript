#!/bin/bash

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

docker-compose \
    -f docker-compose.test.network.yml \
    -f docker-compose.test.yml.tmp.bliny \
    -f docker-compose.test.yml.tmp.pelmeni \
    -f docker-compose.test.yml.tmp.borscht \
    -f docker-compose.test.yml.tmp.pirogi \
    -f docker-compose.test.yml.tmp.oladyi \
    -f docker-compose.test.yml.tmp.olivier \
    up

