#!/bin/bash -e

mkdir -p build

pushd deps/libgpg-error
./download.sh
./build.sh
popd

pushd deps/libgcrypt
./download.sh
./build.sh
popd

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
