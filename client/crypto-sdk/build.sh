#!/bin/bash -e

mkdir -p build
cd build

if [ -n "${DEBUG}" ] ; then
    BUILD_TYPE=Debug
else
    BUILD_TYPE=Release
fi

echo "Building ${BUILD_TYPE} version..."
cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE}

make
