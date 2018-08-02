#!/bin/bash -xe

export CURRENT_NODE_IP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
export INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)

if [ $CURRENT_NODE_IP != $NODE_IP ]; then
    aws ec2 associate-address --region $REGION --instance-id $INSTANCE_ID --allocation-id $EIP
fi

$(aws ecr get-login --no-include-email --region $REGION)
pip install docker-compose

export ENV_FILE=/opt/orbs/.env

echo NODE_IP=$NODE_IP >> $ENV_FILE
echo NODE_NAME=$NODE_NAME >> $ENV_FILE
echo NODE_ENV=$NODE_ENV >> $ENV_FILE
echo INSTANCE_ID=$INSTANCE_ID >> $ENV_FILE
echo ETHEREUM_NODE_HTTP_ADDRESS=$ETHEREUM_NODE_HTTP_ADDRESS >> $ENV_FILE

export DOCKER_TAG=${DOCKER_TAG-master}
# TODO: remove default image
# export DOCKER_IMAGE=${DOCKER_IMAGE-506367651493.dkr.ecr.us-west-2.amazonaws.com/orbs-network}
export DOCKER_IMAGE=506367651493.dkr.ecr.us-west-2.amazonaws.com/orbs-network

crontab /opt/orbs/crontab

$(aws ecr get-login --no-include-email --region us-west-2)
cp /opt/orbs/private-keys/block/secret-key /opt/orbs/private-keys/block/$NODE_NAME
cp /opt/orbs/private-keys/message/secret-key /opt/orbs/private-keys/message/$NODE_NAME

/usr/local/bin/docker-compose -f /opt/orbs/docker-compose.yml up -d
