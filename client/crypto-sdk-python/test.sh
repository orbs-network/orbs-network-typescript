#!/bin/bash -e

LD_LIBRARY_PATH=build/${LOCAL_PLATFORM}/ find test -name '*.py' -exec python '{}' \;
