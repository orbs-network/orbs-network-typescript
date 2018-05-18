#!/bin/bash -e

pushd ../crypto-sdk
    ./build.sh
popd

if [ -n "${DEBUG}" ] ; then
    BUILD_TYPE=Debug
else
    BUILD_TYPE=Release
fi

if [ -z "${PLATFORM}" ]; then
    SYSNAME="$(uname -s)"
fi

case "${SYSNAME}" in
    Darwin)
        export PLATFORM="Mac"
        LOCAL_LIBRARY="${PLATFORM}/lib/libcryptosdk.dylib"

        PYTHON_VERSION=`python -c "import sys;t='{v[0]}.{v[1]}'.format(v=list(sys.version_info[:2]));sys.stdout.write(t)";`
        PYTHON_LIBRARY=/usr/local/Frameworks/Python.framework/Versions/${PYTHON_VERSION}/lib/libpython${PYTHON_VERSION}.dylib
        PYTHON_INCLUDE_DIR=/usr/local/Frameworks/Python.framework/Versions/${PYTHON_VERSION}/Headers/

        CMAKE_ADDITIONAL_ARGS=-DPYTHON_LIBRARY="${PYTHON_LIBRARY} -DPYTHON_INCLUDE_DIR=${PYTHON_INCLUDE_DIR}"

        ;;
    Linux)
        export PLATFORM="Linux"
        LOCAL_LIBRARY="${PLATFORM}/lib/libcryptosdk.so"

        ;;
    *)
        echo "Unsupported system ${SYSNAME}!"
        exit 1

        ;;
esac

echo "Building ${BUILD_TYPE} version for ${PLATFORM:-$(uname -s)}..."

# Copy external crypto-sdk dependencies.
CRYPTO_SDK_BUILD_DIR=../crypto-sdk/build

mkdir -p build/${PLATFORM}
cp -f ${CRYPTO_SDK_BUILD_DIR}/${LOCAL_LIBRARY} build/${PLATFORM}/

pushd build

(cd ../ && CMAKE_ONLY=1 ./clean.sh)
cmake .. ${CMAKE_ADDITIONAL_ARGS} -DCMAKE_BUILD_TYPE=${BUILD_TYPE} -DPLATFORM=${PLATFORM}
make

popd

cp -f build/${PLATFORM}/lib/pycrypto.so test/

./test.sh
