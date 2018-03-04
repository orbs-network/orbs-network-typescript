#!/bin/bash -xe

export INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)
aws ec2 associate-address --region $REGION --instance-id $INSTANCE_ID --allocation-id $EIP

yum install -y docker
service docker start
$(aws ecr get-login --no-include-email --region $REGION)
pip install docker-compose

export ENV_FILE=/opt/orbs/.env

echo NODE_IP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4) >> $ENV_FILE
echo NODE_NAME=$NODE_NAME >> $ENV_FILE
echo NODE_ENV=$NODE_ENV >> $ENV_FILE
echo INSTANCE_ID=$INSTANCE_ID >> $ENV_FILE

export DOCKER_TAG=${DOCKER_TAG-master}
# TODO: remove default image
export DOCKER_IMAGE=${DOCKER_IMAGE-506367651493.dkr.ecr.us-west-2.amazonaws.com/orbs-network}

/usr/local/bin/docker-compose -f /opt/orbs/docker-compose.yml up -d
