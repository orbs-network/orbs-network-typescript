#!/bin/bash -e

pushd ../crypto-sdk
    PLATFORM=ANDROID ./build.sh
popd

if [ -z "${PLATFORM}" ]; then
    SYSNAME="$(uname -s)"
fi

# Copy external crypto-sdk dependencies to jniLibs.
JNILIBS_DIR=crypto-sdk/src/main/jniLibs/
CRYPTO_SDK_BUILD_DIR=../crypto-sdk/build/android
mkdir -p ${JNILIBS_DIR}armeabi-v7a/ ${JNILIBS_DIR}arm64-v8a/ ${JNILIBS_DIR}x86/ ${JNILIBS_DIR}x86_64/
cp -f ${CRYPTO_SDK_BUILD_DIR}/armv7-a/lib/libcryptosdk.so ${JNILIBS_DIR}armeabi-v7a/
cp -f ${CRYPTO_SDK_BUILD_DIR}/armv8-a/lib/libcryptosdk.so ${JNILIBS_DIR}arm64-v8a/
cp -f ${CRYPTO_SDK_BUILD_DIR}/i686/lib/libcryptosdk.so ${JNILIBS_DIR}x86/
cp -f ${CRYPTO_SDK_BUILD_DIR}/westmere/lib/libcryptosdk.so ${JNILIBS_DIR}x86_64/

case "$(uname -s)" in
    Darwin)
        LOCAL_PLATFORM="mac"

        ;;
    Linux)
        LOCAL_PLATFORM="linux"

        ;;
    *)
        echo "Unsupport system ${SYSNAME}!"
        exit 1

        ;;
esac

gradle build
