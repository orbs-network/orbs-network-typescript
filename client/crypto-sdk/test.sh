#!/bin/bash -e

cd build

CTEST_OUTPUT_ON_FAILURE=1 GTEST_COLOR=1 ctest
