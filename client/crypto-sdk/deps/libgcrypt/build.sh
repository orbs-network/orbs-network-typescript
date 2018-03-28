#!/bin/bash -e

function readlink() {
  DIR=$(echo "${1%/*}")
  (cd "$DIR" && echo "$(pwd -P)")
}

NPROCESSORS=$(getconf NPROCESSORS_ONLN 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null)
PROCESSORS=${NPROCESSORS:-3}

LIBGCRYPT_VERSION=1.8.2
LIBGCRYPT_PACKAGE="libgcrypt-${LIBGCRYPT_VERSION}"

PREFIX="$(pwd)/../../build/libgcrypt/"
mkdir -p ${PREFIX}
PREFIX=$(readlink "${PREFIX}")

cd ${LIBGCRYPT_PACKAGE}

case ${PLATFORM} in
    IOS)
        IOS64_PREFIX="$PREFIX/ios/ios64"
        SIMULATOR64_PREFIX="$PREFIX/ios/simulator64"

        mkdir -p ${IOS64_PREFIX} ${SIMULATOR64_PREFIX}

        XCODEDIR=$(xcode-select -p)
        IOS_SIMULATOR_VERSION_MIN=${IOS_SIMULATOR_VERSION_MIN-"6.0.0"}
        IOS_VERSION_MIN=${IOS_VERSION_MIN-"6.0.0"}

        # Path tests/random.c to avoid calling the system() function which isn't available on iOS.
        patch -p0 < ../tests-random.patch

        # Build for the simulator
        BASEDIR="${XCODEDIR}/Platforms/iPhoneSimulator.platform/Developer"
        PATH="${BASEDIR}/usr/bin:$BASEDIR/usr/sbin:$PATH"
        SDK="${BASEDIR}/SDKs/iPhoneSimulator.sdk"

        # x86_64 simulator
        export CFLAGS="-O2 -arch x86_64 -isysroot ${SDK} -mios-simulator-version-min=${IOS_SIMULATOR_VERSION_MIN}"
        export LDFLAGS="-arch x86_64 -isysroot ${SDK} -mios-simulator-version-min=${IOS_SIMULATOR_VERSION_MIN}"

        make distclean > /dev/null || true

        LIBGPG_ERROR_PREFIX="$(pwd)/../../../build/libgpg-error/ios/simulator64"

        ./configure \
            --host=x86_64-apple-darwin \
            --with-gpg-error-prefix=${LIBGPG_ERROR_PREFIX} \
            --with-pic \
            --disable-shared \
            --enable-static \
            --disable-asm \
            --disable-doc \
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

        LIBGPG_ERROR_PREFIX="$(pwd)/../../../build/libgpg-error/ios/ios64"

        ./configure \
            --host=arm-apple-darwin \
            --with-gpg-error-prefix=${LIBGPG_ERROR_PREFIX} \
            --with-pic \
            --disable-shared \
            --enable-static \
            --disable-asm \
            --disable-doc \
            --prefix="${IOS64_PREFIX}"

        make -j${PROCESSORS} install

        # Create universal binary and include folder
        rm -fr -- "${PREFIX}/include" "${PREFIX}/lib/libgcrypt.a" 2> /dev/null
        mkdir -p -- "${PREFIX}/lib"
        lipo -create \
            "${SIMULATOR64_PREFIX}/lib/libgcrypt.a" \
            "${IOS64_PREFIX}/lib/libgcrypt.a" \
            -output "${PREFIX}/lib/libgcrypt.a"
        mv -f -- "${IOS64_PREFIX}/include" "$PREFIX/"

        # Cleanup
        rm -rf -- "${PREFIX}/ios"
        make distclean > /dev/null

        ;;
    *)
        make distclean > /dev/null || true

        LIBGPG_ERROR_PREFIX="$(pwd)/../../../build/libgpg-error/"

        ./configure \
            --with-gpg-error-prefix=${LIBGPG_ERROR_PREFIX} \
            --with-pic \
            --disable-shared \
            --enable-static \
            --disable-asm \
            --disable-doc \
            --prefix="${PREFIX}"

        make -j${PROCESSORS} install

        if [ -n "${CI}" ] ; then
            make -j${PROCESSORS} check
        fi
esac
