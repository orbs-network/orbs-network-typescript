#!/bin/bash

yum install -y docker
service docker start

docker run -d -p 8545:8545 parity/parity:v1.8.9 --no-secretstore --rpcapi=web3 --no-ui --no-ipc --no-ws --no-jsonrpc --no-ancient-blocks