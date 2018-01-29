#!/bin/bash -xe

export INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)
aws ec2 associate-address --region us-west-2 --instance-id $INSTANCE_ID --allocation-id $EIP

export DOCKER_IMAGE=506367651493.dkr.ecr.us-west-2.amazonaws.com/orbs-network
# TODO replace default with master
export DOCKER_TAG=${DOCKER_TAG-refactor-discovery}
export GOSSIP_LEADER_IP=34.212.214.57
export GOSSIP_PEERS="ws://34.212.214.57:60001,ws://34.216.83.89:60001,ws://35.162.45.85:60001,ws://35.164.231.84:60001,ws://52.41.174.161:60001,ws://54.69.53.169:60001"

yum install -y docker
service docker start
$(aws ecr get-login --no-include-email --region us-west-2)
pip install docker-compose


export NODE_IP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)

/usr/local/bin/docker-compose -f /opt/orbs/docker-compose.yml up -d
