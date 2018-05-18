#!/bin/bash -e

pushd ../crypto-sdk
    PLATFORM=iOS ./build.sh
popd
