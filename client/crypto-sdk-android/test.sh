#!/bin/bash -e

if [ -n "${DEBUG}" ] ; then
    BUILD_TYPE=Debug
else
    BUILD_TYPE=Release
fi

gradle test${BUILD_TYPE}UnitTest
