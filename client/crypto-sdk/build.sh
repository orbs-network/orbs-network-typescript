#!/bin/bash -e

mkdir -p build

if [ ! -d "build/libgpg-error" ] ; then
    pushd deps/libgpg-error
    ./download.sh
    ./build.sh
    popd
fi

if [ ! -d "build/libgcrypt" ] ; then
    pushd deps/libgcrypt
    ./download.sh
    ./build.sh
    popd
fi

pushd build

if [ -z ${PLATFORM+x} ] ;  then
    PLATFORM=$(uname -s)
fi

if [ -n "${DEBUG}" ] ; then
    BUILD_TYPE=Debug
else
    BUILD_TYPE=Release
fi

echo "Building ${BUILD_TYPE} version for ${PLATFORM}..."

case ${PLATFORM} in
    IOS)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DCMAKE_TOOLCHAIN_FILE="toolchains/ios.cmake" -DIOS_PLATFORM="iPhoneSimulator"

        ;;
    ANDROID)
        case "$(uname -s)" in
            Darwin)
                export ANDROID_NDK=~/Library/Android/sdk

                ;;
            *)
                ;;
        esac

        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DCMAKE_TOOLCHAIN_FILE="toolchains/android.cmake"

        ;;
    *)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE}

        ;;
esac

make

popd

./test.sh
