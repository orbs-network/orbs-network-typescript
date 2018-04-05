#!/bin/bash -e

pushd ../crypto-sdk
    PLATFORM=ANDROID ./build-deps.sh
popd

gradle build
