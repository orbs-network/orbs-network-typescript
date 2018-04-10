#!/bin/bash -e

function build_ios() {
    echo "Building for ${IOS_PLATFORM}..."

    (cd ../ && CMAKE_ONLY=1 ./clean.sh)
    cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=IOS -DIOS_PLATFORM=${IOS_PLATFORM} -DCMAKE_TOOLCHAIN_FILE="toolchains/ios.toolchain.cmake"
    make
}

function build_android() {
    echo "Building for ${ANDROID_ABI}..."

    if [ -z "$ANDROID_NDK_HOME" ]; then
        case "$(uname -s)" in
            Darwin)
                ANDROID_NDK_HOME=~/Library/Android/sdk/ndk-bundle

                ;;
            Linux)
                ANDROID_NDK_HOME=/opt/Android/sdk/ndk-bundle

                ;;
            *)
                ;;
        esac
    fi

    (cd ../ && CMAKE_ONLY=1 ./clean.sh)
    cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=ANDROID -DANDROID_ABI=${ANDROID_ABI} -DCMAKE_TOOLCHAIN_FILE="${ANDROID_NDK_HOME}/build/cmake/android.toolchain.cmake"
    make
}

function build_current() {
    (cd ../ && CMAKE_ONLY=1 ./clean.sh)
    cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=${PLATFORM}
    make
}

if [ -z "${PLATFORM}" ]; then
    SYSNAME="$(uname -s)"
    case ${SYSNAME} in
        Darwin)
            export PLATFORM="Mac"

            ;;
        Linux)
            export PLATFORM="Linux"

            ;;
        *)
            echo "Unsupport system ${SYSNAME}!"
            exit 1

            ;;
    esac
fi

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
        IOS_PLATFORM="iPhoneSimulator"
        build_ios

        ;;
    ANDROID)
        ANDROID_ABI="armeabi-v7a"
        build_android

        ANDROID_ABI="arm64-v8a"
        build_android

        ANDROID_ABI="x86"
        build_android

        ANDROID_ABI="x86_64"
        build_android

        ;;
    *)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=${PLATFORM}
        make

        ;;
esac

popd

./test.sh
