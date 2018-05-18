#!/bin/bash -e

function build_ios() {
    echo "Building for ${IOS_PLATFORM}..."

    (cd ../ && CMAKE_ONLY=1 ./clean.sh)
    cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=iOS -DIOS_PLATFORM=${IOS_PLATFORM} -DCMAKE_TOOLCHAIN_FILE="toolchains/ios.toolchain.cmake"
    make
}

function build_android() {
    echo "Building for ${ANDROID_ABI}..."

    case "$(uname -s)" in
        Darwin)
            ANDROID_HOME=${ANDROID_HOME:-~/Library/Android/sdk}
            ANDROID_NDK_HOME=${ANDROID_HOME}/ndk-bundle

            ;;
        Linux)
            ANDROID_HOME=${ANDROID_HOME:-/opt/Android/sdk}
            ANDROID_NDK_HOME=${ANDROID_HOME}/ndk-bundle

            ;;
        *)
            ;;
    esac

    (cd ../ && CMAKE_ONLY=1 ./clean.sh)
    cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=Android -DANDROID_ABI=${ANDROID_ABI} -DCMAKE_TOOLCHAIN_FILE="${ANDROID_NDK_HOME}/build/cmake/android.toolchain.cmake"
    make
}

function build_current() {
    case ${PLATFORM} in
        iOS)
            (cd ../ && CMAKE_ONLY=1 ./clean.sh)

            ;;
        Android)
            (cd ../ && CMAKE_ONLY=1 ./clean.sh)

            ;;
    esac

    cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=${LOCAL_PLATFORM}
    make
}

SYSNAME="$(uname -s)"
case ${SYSNAME} in
    Darwin)
        export LOCAL_PLATFORM="Mac"

        ;;
    Linux)
        export LOCAL_PLATFORM="Linux"

        ;;
    *)
        echo "Unsupported system ${SYSNAME}!"
        exit 1

        ;;
esac

export PLATFORM=${PLATFORM:-${LOCAL_PLATFORM}}

./build-deps.sh

pushd build

if [ -n "${DEBUG}" ] ; then
    BUILD_TYPE=Debug
else
    BUILD_TYPE=Release
fi

echo "Building ${BUILD_TYPE} version for ${PLATFORM:-$(uname -s)}..."

case ${PLATFORM} in
    iOS)
        IOS_PLATFORM="iPhoneSimulator"
        build_ios

        ;;
    Android)
        ANDROID_ABI="armeabi-v7a"
        build_android

        ANDROID_ABI="arm64-v8a"
        build_android

        ANDROID_ABI="x86"
        build_android

        ANDROID_ABI="x86_64"
        build_android

        build_current
        ;;
    *)
        build_current

        ;;
esac

popd

./test.sh
