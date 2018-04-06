#!/bin/bash -e

if [ -n "${CMAKE_ONLY}" ] ; then
    rm -rf build/CMakeFiles build/cmake_install.cmake build/CMakeCache.txt build/Makefile
else
    rm -rf build
fi
