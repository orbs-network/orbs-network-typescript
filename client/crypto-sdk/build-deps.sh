#!/bin/bash -e

mkdir -p build

if [ ! -d "build/${PLATFORM}/libgpg-error" ] ; then
    pushd deps/libgpg-error
    ./download.sh
    ./build.sh
    popd
fi

if [ ! -d "build/${PLATFORM}/libgcrypt/" ] ; then
    pushd deps/libgcrypt
    ./download.sh
    ./build.sh
    popd
fi
