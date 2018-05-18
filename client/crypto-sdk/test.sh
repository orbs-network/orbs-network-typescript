#!/bin/bash -e

cd build

case ${PLATFORM} in
    iOS)
        ;;
    Android)
        ;;
    *)
        CTEST_OUTPUT_ON_FAILURE=1 GTEST_COLOR=1 ctest

        ;;
esac
