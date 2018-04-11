#!/bin/bash -e

pushd ../crypto-sdk
    PLATFORM=ANDROID ./build.sh
popd

if [ -z "${PLATFORM}" ]; then
    SYSNAME="$(uname -s)"
fi

# Copy external crypto-sdk dependencies to jniLibs.
JNILIBS_DIR=crypto-sdk/src/main/jniLibs
CRYPTO_SDK_BUILD_DIR=../crypto-sdk/build
CRYPTO_SDK_ANDROID_BUILD_DIR=${CRYPTO_SDK_BUILD_DIR}/android
CRYPTO_SDK_JAVA_BUILD_DIR=crypto-sdk/build/outputs/jar
mkdir -p ${JNILIBS_DIR}/armeabi-v7a/ ${JNILIBS_DIR}/arm64-v8a/ ${JNILIBS_DIR}/x86/ ${JNILIBS_DIR}/x86_64/
cp -f ${CRYPTO_SDK_ANDROID_BUILD_DIR}/armv7-a/lib/libcryptosdk.so ${JNILIBS_DIR}/armeabi-v7a/
cp -f ${CRYPTO_SDK_ANDROID_BUILD_DIR}/armv8-a/lib/libcryptosdk.so ${JNILIBS_DIR}/arm64-v8a/
cp -f ${CRYPTO_SDK_ANDROID_BUILD_DIR}/i686/lib/libcryptosdk.so ${JNILIBS_DIR}/x86/
cp -f ${CRYPTO_SDK_ANDROID_BUILD_DIR}/westmere/lib/libcryptosdk.so ${JNILIBS_DIR}/x86_64/

case "$(uname -s)" in
    Darwin)
        LOCAL_PLATFORM="mac"
        LOCAL_LIBRARY="${LOCAL_PLATFORM}/lib/libcryptosdk.dylib"

        ;;
    Linux)
        LOCAL_PLATFORM="linux"
        LOCAL_LIBRARY="${LOCAL_PLATFORM}/lib/libcryptosdk.so"

        ;;
    *)
        echo "Unsupported system ${SYSNAME}!"
        exit 1

        ;;
esac

mkdir -p ${CRYPTO_SDK_JAVA_BUILD_DIR}
cp -f ${CRYPTO_SDK_BUILD_DIR}/${LOCAL_LIBRARY} ${CRYPTO_SDK_JAVA_BUILD_DIR}

if [ -n "${DEBUG}" ] ; then
    BUILD_TYPE=Debug
else
    BUILD_TYPE=Release
fi

gradle assemble${BUILD_TYPE}
