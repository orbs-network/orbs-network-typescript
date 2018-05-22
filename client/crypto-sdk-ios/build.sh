#!/bin/bash -e

pushd ../crypto-sdk
    PLATFORM=ios ./build.sh
popd
