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

pushd build

if [ -n "${DEBUG}" ] ; then
    BUILD_TYPE=Debug
else
    BUILD_TYPE=Release
fi

echo "Building ${BUILD_TYPE} version..."
cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE}

make

popd

./test.sh
