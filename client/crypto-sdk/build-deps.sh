#!/bin/bash -e

mkdir -p build

if [ ! -d "build/libgpg-error" ] ; then
    pushd deps/libgpg-error
    ./download.sh
    ./build.sh
    popd
fi

if [ ! -d "build/libgcrypt" ] ; then
    pushd deps/libgcrypt
    ./download.sh
    ./build.sh
    popd
fi
