#!/bin/bash -xe

export NETWORK=testnet
export AWS_ACCOUNT_ID=506367651493
export DNS_ZONE=orbs-test.com
export S3_BUCKET_NAME=orbs-network-config
export REGIONS=${REGIONS-us-east-1,eu-central-1,ap-northeast-1,ap-northeast-2,ap-southeast-2,ca-central-1}
export DOCKER_TAG=${DOCKER_TAG-master}
export DEPLOY_STEP=${DEPLOY_STEP-2}
export ETHEREUM_NODE_IP=34.212.214.57

npm run build-ts

node dist/multi-account.js \
    --region $REGIONS \
    --dns-zone $DNS_ZONE \
    --account-id $AWS_ACCOUNT_ID \
    --network $NETWORK \
    --s3-bucket-name $S3_BUCKET_NAME \
    --docker-image ${DOCKER_IMAGE} \
    --docker-tag ${DOCKER_TAG} \
    --step $DEPLOY_STEP \
    --ethereum-node-ip $ETHEREUM_NODE_IP \
    --remove-node \
    --deploy-node
