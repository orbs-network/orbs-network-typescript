#!/bin/bash -e

mkdir -p build

if [ -z "${PLATFORM}" ]; then
    echo "You should set PLATFORM to the name of the target build!"
    exit 1
fi

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
