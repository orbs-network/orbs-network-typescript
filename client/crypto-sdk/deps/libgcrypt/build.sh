#!/bin/bash -e

function readlink() {
  DIR=$(echo "${1%/*}")
  (cd "$DIR" && echo "$(pwd -P)")
}

function build_ios() {
    INSTALL_PREFIX="${PREFIX}/${TARGET_ARCH}"
    LIBGPG_ERROR_PREFIX="$(pwd)/../../../build/${PLATFORM_PREFIX}/libgpg-error/${TARGET_ARCH}"

    make distclean > /dev/null || true

    ./configure \
        --host=${HOST_COMPILER} \
        --with-gpg-error-prefix=${LIBGPG_ERROR_PREFIX} \
        --with-pic \
        --enable-static \
        --disable-shared \
        --disable-asm \
        --disable-doc \
        --prefix="${INSTALL_PREFIX}"

    make -j${PROCESSORS} install
}

function build_android() {
    case "$(uname -s)" in
        Darwin)
            ANDROID_NDK_HOME=~/Library/Android/sdk/ndk-bundle

            ;;
        *)
            ;;
    esac

    NDK_PLATFORM=${NDK_PLATFORM-"android-16"}
    NDK_PLATFORM_COMPAT="${NDK_PLATFORM_COMPAT:-${NDK_PLATFORM}}"
    NDK_API_VERSION=$(echo "$NDK_PLATFORM" | sed 's/^android-//')
    NDK_API_VERSION_COMPAT=$(echo "$NDK_PLATFORM_COMPAT" | sed 's/^android-//')

    if [ -z "$ANDROID_NDK_HOME" ]; then
        echo "You should set ANDROID_NDK_HOME to the directory containing the Android NDK"
        exit 1
    fi

    INSTALL_PREFIX="${PREFIX}/${TARGET_ARCH}"
    MAKE_TOOLCHAIN="${ANDROID_NDK_HOME}/build/tools/make_standalone_toolchain.py"
    TOOLCHAIN_DIR="$(pwd)/android-toolchain-${TARGET_ARCH}"

    OLD_PATH=${PATH}
    export PATH="${PATH}:${TOOLCHAIN_DIR}/bin"
    export CC="${HOST_COMPILER}-clang"

    rm -rf "${TOOLCHAIN_DIR}" "${INSTALL_PREFIX}"
    make distclean > /dev/null || true

    "$MAKE_TOOLCHAIN" --force --api="$NDK_API_VERSION_COMPAT" --arch="$ARCH" --install-dir="$TOOLCHAIN_DIR" || exit 1

    LIBGPG_ERROR_PREFIX="$(pwd)/../../../build/${PLATFORM_PREFIX}/libgpg-error/${TARGET_ARCH}"

    ./configure \
        --host="${HOST_COMPILER}" \
        --with-gpg-error-prefix=${LIBGPG_ERROR_PREFIX} \
        --with-pic \
        --enable-static \
        --disable-shared \
        --disable-asm \
        --disable-doc \
        --with-sysroot="${TOOLCHAIN_DIR}/sysroot" \
        --prefix="${INSTALL_PREFIX}"

    make -j${PROCESSORS} install

    export PATH=${OLD_PATH}
}

NPROCESSORS=$(getconf NPROCESSORS_ONLN 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null)
PROCESSORS=${NPROCESSORS:-3}

LIBGCRYPT_VERSION=1.8.2
LIBGCRYPT_PACKAGE="libgcrypt-${LIBGCRYPT_VERSION}"

PLATFORM_PREFIX=$(echo "${PLATFORM}" | awk '{print tolower($0)}')
PREFIX="$(pwd)/../../build/${PLATFORM_PREFIX}/libgcrypt/"
mkdir -p ${PREFIX}
PREFIX=$(readlink "${PREFIX}")

cd ${LIBGCRYPT_PACKAGE}

case ${PLATFORM} in
    IOS)
        # Fix compilation errors by:
        #   1. Patching tests/random.c in order to avoid calling the system() function which isn't available on iOS.
        #   2. Patching src/sexp.c to explicitly implement stpcpy, which is missing when building for x86.

        patch -p0 -N < ../libgcrypt.patch || true

        XCODEDIR=$(xcode-select -p)

        # Build for the simulator.
        BASEDIR="${XCODEDIR}/Platforms/iPhoneSimulator.platform/Developer"
        PATH="${BASEDIR}/usr/bin:$BASEDIR/usr/sbin:$PATH"
        SDK="${BASEDIR}/SDKs/iPhoneSimulator.sdk"
        IOS_SIMULATOR_VERSION_MIN=${IOS_SIMULATOR_VERSION_MIN:-"6.0.0"}
        TARGET_ARCH="simulator64"
        HOST_COMPILER="x86_64-apple-darwin"
        export CFLAGS="-O2 -arch x86_64 -isysroot ${SDK} -mios-simulator-version-min=${IOS_SIMULATOR_VERSION_MIN}"
        export LDFLAGS="-arch x86_64 -isysroot ${SDK} -mios-simulator-version-min=${IOS_SIMULATOR_VERSION_MIN}"
        build_ios

        # Build for iOS.
        BASEDIR="${XCODEDIR}/Platforms/iPhoneOS.platform/Developer"
        PATH="${BASEDIR}/usr/bin:$BASEDIR/usr/sbin:$PATH"
        SDK="${BASEDIR}/SDKs/iPhoneOS.sdk"
        IOS_VERSION_MIN=${IOS_VERSION_MIN:-"6.0.0"}
        TARGET_ARCH="arm64"
        HOST_COMPILER="arm-apple-darwin"
        export CFLAGS="-fembed-bitcode -O2 -arch arm64 -isysroot ${SDK} -mios-version-min=${IOS_VERSION_MIN} -fembed-bitcode"
        export LDFLAGS="-fembed-bitcode -arch arm64 -isysroot ${SDK} -mios-version-min=${IOS_VERSION_MIN} -fembed-bitcode"
        build_ios

        # Create a universal binary and include folder.
        IOS64_PREFIX="$PREFIX/arm64"
        SIMULATOR64_PREFIX="$PREFIX/simulator64"

        rm -fr -- "${PREFIX}/include" "${PREFIX}/lib/libgcrypt.a" 2> /dev/null
        mkdir -p -- "${PREFIX}/lib"
        lipo -create \
            "${SIMULATOR64_PREFIX}/lib/libgcrypt.a" \
            "${IOS64_PREFIX}/lib/libgcrypt.a" \
            -output "${PREFIX}/lib/libgcrypt.a"
        mv -f -- "${IOS64_PREFIX}/include" "$PREFIX/"

        ;;
    ANDROID)
        # Fix compilation errors by:
        #   1. Patching tests/random.c in order to avoid calling the system() function which isn't available on iOS.
        #   2. Patching src/sexp.c to explicitly implement stpcpy, which is missing when building for x86.

        patch -p0 -N < ../libgcrypt.patch || true

        # Build for armv7a.
        TARGET_ARCH="armv7-a"
        CFLAGS="-Os -mfloat-abi=softfp -mfpu=vfpv3-d16 -mthumb -marm -march=${TARGET_ARCH}"
        ARCH="arm"
        HOST_COMPILER="arm-linux-androideabi"
        build_android

        # Build for armv8-a.
        TARGET_ARCH="armv8-a"
        CFLAGS="-Os -march=${TARGET_ARCH}"
        ARCH="arm64"
        HOST_COMPILER="aarch64-linux-android"
        NDK_PLATFORM="android-21"
        NDK_PLATFORM_COMPAT="android-21"
        build_android

        # Build for x86.
        TARGET_ARCH="i686"
        CFLAGS="-Os -march=${TARGET_ARCH} -DIMPLEMENT_STPCPY"
        ARCH="x86"
        HOST_COMPILER="i686-linux-android"
        NDK_PLATFORM="android-21"
        NDK_PLATFORM_COMPAT="android-21"
        build_android

        # Build for x86_64.
        TARGET_ARCH="westmere"
        CFLAGS="-Os -march=${TARGET_ARCH}"
        ARCH="x86_64"
        HOST_COMPILER="x86_64-linux-android"
        NDK_PLATFORM="android-21"
        NDK_PLATFORM_COMPAT="android-21"
        build_android

        ;;
    *)
        make distclean > /dev/null || true

        LIBGPG_ERROR_PREFIX="$(pwd)/../../../build/${PLATFORM_PREFIX}/libgpg-error/"

        ./configure \
            --with-gpg-error-prefix=${LIBGPG_ERROR_PREFIX} \
            --with-pic \
            --enable-static \
            --disable-shared \
            --disable-asm \
            --disable-doc \
            --prefix="${PREFIX}"

        make -j${PROCESSORS} install

        if [ -n "${CI}" ] ; then
            make -j${PROCESSORS} check
        fi
esac
