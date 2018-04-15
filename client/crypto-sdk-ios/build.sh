#!/bin/bash -e

pushd ../crypto-sdk
    PLATFORM=IOS ./build.sh
popd
