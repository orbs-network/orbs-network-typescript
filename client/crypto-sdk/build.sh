#!/bin/bash -e

./build-deps.sh

pushd build

if [ -n "${DEBUG}" ] ; then
    BUILD_TYPE=Debug
else
    BUILD_TYPE=Release
fi

echo "Building ${BUILD_TYPE} version for ${PLATFORM:-$(uname -s)}..."

case ${PLATFORM} in
    IOS)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DCMAKE_TOOLCHAIN_FILE="toolchains/ios.cmake" -DIOS_PLATFORM="iPhoneSimulator"

        ;;
    ANDROID)
        echo "Please run build.sh from crypto-sdk-android..."
        exit 1

        ;;
    *)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE}

        ;;
esac

make

popd

./test.sh
