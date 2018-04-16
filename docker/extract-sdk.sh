#!/bin/bash

mkdir -p artifacts

export SDK_CONTAINER=$(docker run -d --rm orbs:sdk sleep 60)

export ANDROID_EAR=client/crypto-sdk-android/crypto-sdk/build/outputs/ear
export ANDROID_JAR=client/crypto-sdk-android/crypto-sdk/build/outputs/jar

export ARTIFACTS=($ANDROID_JAR $ANDROID_EAR)

for i in $ARTIFACTS; do
    mkdir -p artifacts/$i
    docker cp $SDK_CONTAINER:/opt/orbs/$i artifacts/$i
done
