#!/bin/bash -e

aws cloudformation create-stack --template-body file://`pwd`/cloudformation.yaml --parameters "$(cat parameters.parity.json)" --stack-name orbs-network-parity