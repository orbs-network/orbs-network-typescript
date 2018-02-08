#!/bin/bash -e

aws cloudformation create-stack --region us-west-2 --template-body file://`pwd`/cloudformation.yaml --parameters "$(cat parameters.parity.json)" --stack-name orbs-network-parity
