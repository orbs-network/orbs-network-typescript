#!/bin/bash -e

mkdir -p build
cd build

if [ -n "${DEBUG}" ] ; then
    echo "Building bebug version..."
    cmake .. -DCMAKE_BUILD_TYPE=Debug
else
    echo "Building release version..."
    cmake .. -DCMAKE_BUILD_TYPE=Release
fi

make
