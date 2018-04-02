#!/bin/bash -xe

export AWS_ACCOUNT_ID=506367651493
export REGIONS=${REGIONS-us-east-1,eu-central-1,ap-northeast-1,ap-northeast-2,ap-southeast-2,ca-central-1}

mkdir -p \
    temp-keys/private-keys/message \
    temp-keys/public-keys/message

for REGION in $(echo $REGIONS | sed -e 's/,/ /g'); do
    export KEY_NAME=orbs-global-$AWS_ACCOUNT_ID-staging-$REGION

    ssh-keygen -t rsa -b 4096 -N "" -f temp-keys/$KEY_NAME-message
    ssh-keygen -f temp-keys/$KEY_NAME-message.pub -e -m pem > temp-keys/public-keys/message/$KEY_NAME
    cp temp-keys/$KEY_NAME-message temp-keys/private-keys/message/$KEY_NAME

    rm -rf temp-keys/$KEY_NAME*
done

mkdir -p bootstrap/public-keys/message

cp -rf temp-keys/public-keys/message/* bootstrap/public-keys/message
