#!/bin/bash

export INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)
aws ec2 associate-address --region us-west-2 --instance-id $INSTANCE_ID --allocation-id $EIP

yum install -y docker
service docker start

docker run -d -p 8545:8545 parity/parity:v1.8.9 --no-secretstore --rpcapi=web3 --no-ui --no-ipc --no-ws --no-jsonrpc --no-ancient-blocks
