#!/bin/bash -e

mkdir -p build

PLATFORM_PREFIX=$(echo "${PLATFORM}" | awk '{print tolower($0)}')

if [ ! -d "build/${PLATFORM_PREFIX}/libgpg-error" ] ; then
    pushd deps/libgpg-error
    ./download.sh
    ./build.sh
    popd
fi

if [ ! -d "build/${PLATFORM_PREFIX}/libgcrypt/" ] ; then
    pushd deps/libgcrypt
    ./download.sh
    ./build.sh
    popd
fi
