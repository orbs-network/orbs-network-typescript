#!/bin/bash -e

if [ -n "${CMAKE_ONLY}" ] ; then
    find "build/" -type d -name "CMakeFiles" -exec rm -r {} +
    find "build/" -type f -name "*.cmake" -exec rm -r {} +
    find "build/" -type f -name "CMakeCache.txt" -exec rm -r {} +
    find "build/" -type f -name "Makefile" -exec rm -r {} +
else
    rm -rf build
fi
