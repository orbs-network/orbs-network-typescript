#!/bin/bash -xe

export NETWORK=testnet
export AWS_ACCOUNT_ID=506367651493
export DNS_ZONE=orbs-test.com
export S3_BUCKET_NAME=orbs-network-config
export REGIONS=${REGIONS-us-east-1 eu-central-1 ap-northeast-1 ap-northeast-2 ap-southeast-2 ca-central-1}

for REGION in $REGIONS
do
    echo $REGION

    # node src/deploy.js \
    #     --region $REGION \
    #     --dns-zone $DNS_ZONE \
    #     --account-id $AWS_ACCOUNT_ID \
    #     --network $NETWORK \
    #     --s3-bucket-name $S3_BUCKET_NAME \
    #     --create-basic-infrastructure

    node src/deploy.js \
        --region $REGION \
        --dns-zone $DNS_ZONE \
        --account-id $AWS_ACCOUNT_ID \
        --network $NETWORK \
        --s3-bucket-name $S3_BUCKET_NAME \
        --tag-docker-image \
        --push-docker-image \
        --remove-node \
        --deploy-node
done
