#!/bin/bash -e

export INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)
aws ec2 associate-address --region ${REGION} --instance-id $INSTANCE_ID --allocation-id $EIP

export ETHEREUM_CHAIN=${ETHEREUM_CHAIN-ropsten}
export PARITY_LOCAL_PATH=/mnt/data/
mkdir -p $PARITY_LOCAL_PATH

mkfs.ext3 -F /dev/xvdc
mount /dev/xvdc $PARITY_LOCAL_PATH

yum install -y docker
service docker start

pip install docker-compose

/usr/local/bin/docker-compose -f /opt/parity/docker-compose.yml up -d
