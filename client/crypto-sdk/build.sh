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
        (cd ../ && CMAKE_ONLY=1 ./clean.sh)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DCMAKE_TOOLCHAIN_FILE="toolchains/ios.toolchain.cmake" -DIOS_PLATFORM="iPhoneSimulator"
        make

        ;;
    ANDROID)
        case "$(uname -s)" in
            Darwin)
                ANDROID_NDK_HOME=~/Library/Android/sdk/ndk-bundle

                ;;
            *)
                ;;
        esac

        (cd ../ && CMAKE_ONLY=1 ./clean.sh)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=ANDROID -DANDROID_ABI=armeabi-v7a -DCMAKE_TOOLCHAIN_FILE="${ANDROID_NDK_HOME}/build/cmake/android.toolchain.cmake"
        make

        (cd ../ && CMAKE_ONLY=1 ./clean.sh)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=ANDROID -DANDROID_ABI=arm64-v8a -DCMAKE_TOOLCHAIN_FILE="${ANDROID_NDK_HOME}/build/cmake/android.toolchain.cmake"
        make

        (cd ../ && CMAKE_ONLY=1 ./clean.sh)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=ANDROID -DANDROID_ABI=x86 -DCMAKE_TOOLCHAIN_FILE="${ANDROID_NDK_HOME}/build/cmake/android.toolchain.cmake"
        make

        (cd ../ && CMAKE_ONLY=1 ./clean.sh)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=ANDROID -DANDROID_ABI=x86_64 -DCMAKE_TOOLCHAIN_FILE="${ANDROID_NDK_HOME}/build/cmake/android.toolchain.cmake"
        make

        ;;
    *)
        cmake .. -DCMAKE_BUILD_TYPE=${BUILD_TYPE}
        make

        ;;
esac

popd

./test.sh
