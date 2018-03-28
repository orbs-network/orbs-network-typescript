#!/bin/bash -e

function readlink() {
  DIR=$(echo "${1%/*}")
  (cd "$DIR" && echo "$(pwd -P)")
}

NPROCESSORS=$(getconf NPROCESSORS_ONLN 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null)
PROCESSORS=${NPROCESSORS:-3}

LIBGPG_ERROR_VERSION=1.27
LIBGPG_ERROR_PACKAGE="libgpg-error-${LIBGPG_ERROR_VERSION}"

PREFIX="$(pwd)/../../build/libgpg-error/"
mkdir -p ${PREFIX}
PREFIX=$(readlink "${PREFIX}")

cd ${LIBGPG_ERROR_PACKAGE}

case ${PLATFORM} in
    IOS)
        IOS64_PREFIX="$PREFIX/ios/ios64"
        SIMULATOR64_PREFIX="$PREFIX/ios/simulator64"

        mkdir -p ${IOS64_PREFIX} ${SIMULATOR64_PREFIX}

        XCODEDIR=$(xcode-select -p)
        IOS_SIMULATOR_VERSION_MIN=${IOS_SIMULATOR_VERSION_MIN-"6.0.0"}
        IOS_VERSION_MIN=${IOS_VERSION_MIN-"6.0.0"}

        # Build for the simulator
        BASEDIR="${XCODEDIR}/Platforms/iPhoneSimulator.platform/Developer"
        PATH="${BASEDIR}/usr/bin:$BASEDIR/usr/sbin:$PATH"
        SDK="${BASEDIR}/SDKs/iPhoneSimulator.sdk"

        # x86_64 simulator
        export CFLAGS="-O2 -arch x86_64 -isysroot ${SDK} -mios-simulator-version-min=${IOS_SIMULATOR_VERSION_MIN}"
        export LDFLAGS="-arch x86_64 -isysroot ${SDK} -mios-simulator-version-min=${IOS_SIMULATOR_VERSION_MIN}"

        make distclean > /dev/null || true

        ./configure \
            --host=x86_64-apple-darwin \
            --with-pic \
            --enable-static \
            --disable-shared \
            --disable-nls \
            --disable-languages \
            --prefix="${SIMULATOR64_PREFIX}"

        make -j${PROCESSORS} install

        # Build for iOS
        BASEDIR="${XCODEDIR}/Platforms/iPhoneOS.platform/Developer"
        PATH="${BASEDIR}/usr/bin:$BASEDIR/usr/sbin:$PATH"
        SDK="${BASEDIR}/SDKs/iPhoneOS.sdk"

        ## 64-bit iOS
        export CFLAGS="-fembed-bitcode -O2 -arch arm64 -isysroot ${SDK} -mios-version-min=${IOS_VERSION_MIN} -fembed-bitcode"
        export LDFLAGS="-fembed-bitcode -arch arm64 -isysroot ${SDK} -mios-version-min=${IOS_VERSION_MIN} -fembed-bitcode"

        make distclean > /dev/null

        ./configure \
            --host=arm-apple-darwin \
            --with-pic \
            --enable-static \
            --disable-shared \
            --disable-nls \
            --disable-languages \
            --prefix="${IOS64_PREFIX}"

        make -j${PROCESSORS} install

        # Create universal binary and include folder
        rm -fr -- "${PREFIX}/include" "${PREFIX}/lib/libgpg-error.a" 2> /dev/null
        mkdir -p -- "${PREFIX}/lib"
        lipo -create \
            "${SIMULATOR64_PREFIX}/lib/libgpg-error.a" \
            "${IOS64_PREFIX}/lib/libgpg-error.a" \
            -output "${PREFIX}/lib/libgpg-error.a"
        cp -rf -- "${SIMULATOR64_PREFIX}/include" "$PREFIX/"

        # Cleanup
        make distclean > /dev/null

        ;;
    *)
        make distclean > /dev/null || true

        ./configure \
            --with-pic \
            --enable-static \
            --disable-shared \
            --disable-nls \
            --disable-languages \
            --prefix="${PREFIX}"

        make -j${PROCESSORS} install

        if [ -n "${CI}" ] ; then
            make -j${PROCESSORS} check
        fi

        make distclean > /dev/null || true

        ;;
esac
