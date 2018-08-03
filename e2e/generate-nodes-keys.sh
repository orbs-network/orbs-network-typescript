#!/bin/bash -xe

export AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID-506367651493}
export REGIONS=${REGIONS-us-east-1,eu-central-1,ap-northeast-1,ap-northeast-2,ap-southeast-2,ca-central-1}
export KEY_TYPE=${KEY_TYPE-consensus}
export NODE_ENV=${NODE_ENV-staging}
export NUM_OF_NODES=${NUM_OF_NODES-6}
export ROOT_DIR=$(cd "$(dirname "$0")/.."; pwd)
echo $NODE_NAME
rm -rf temp-keys

mkdir -p \
    temp-keys/private-keys/$KEY_TYPE \
    temp-keys/public-keys/$KEY_TYPE

NODE_NAMES=($(seq 1 1 $NUM_OF_NODES))
for i in ${NODE_NAMES[@]};
    do
        NODE_NAMES[$i-1]=node$i
    done
NODE_NAMES+=('tester')
# echo ${NODE_NAMES[@]}


for NODE_NAME in $(echo ${NODE_NAMES[@]} | sed -e 's/,/ /g'); do
    export KEY_NAME=$NODE_NAME
    ssh-keygen -t rsa -b 4096 -N "" -f temp-keys/$KEY_NAME-$KEY_TYPE
    ssh-keygen -f temp-keys/$KEY_NAME-$KEY_TYPE.pub -e -m pem > temp-keys/public-keys/$KEY_TYPE/$KEY_NAME
    cp temp-keys/$KEY_NAME-$KEY_TYPE temp-keys/private-keys/$KEY_TYPE/$KEY_NAME

done

mkdir -p ./config/docker/public-keys/$KEY_TYPE
mkdir -p ./config/docker/private-keys/$KEY_TYPE

rm -rf ./config/docker/public-keys/$KEY_TYPE/*
rm -rf ./config/docker/private-keys/$KEY_TYPE/*

cp -rf temp-keys/public-keys/$KEY_TYPE/* ./config/docker/public-keys/$KEY_TYPE
cp -rf temp-keys/private-keys/$KEY_TYPE/* ./config/docker/private-keys/$KEY_TYPE

rm -rf temp-keys



