#!/bin/bash -e

cd build

case ${PLATFORM} in
    ios)
        ;;
    android)
        ;;
    *)
        CTEST_OUTPUT_ON_FAILURE=1 GTEST_COLOR=1 ctest

        ;;
esac
