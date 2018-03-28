#!/bin/bash -e

function readlink() {
  DIR=$(echo "${1%/*}")
  (cd "$DIR" && echo "$(pwd -P)")
}

LIBGCRYPT_VERSION=1.8.2
LIBGCRYPT_PACKAGE="libgcrypt-${LIBGCRYPT_VERSION}"

PREFIX="$(pwd)/../../build/libgcrypt/"
mkdir -p ${PREFIX}
PREFIX=$(readlink "${PREFIX}")

LIBGPG_ERROR_PREFIX=$(readlink "$(pwd)/../../build/libgpg-error/")

cd ${LIBGCRYPT_PACKAGE}

make distclean > /dev/null || true

./configure \
    --with-gpg-error-prefix=${LIBGPG_ERROR_PREFIX} \
    --with-pic \
    --disable-shared \
    --enable-static \
    --disable-asm \
    --disable-doc \
    --prefix="${PREFIX}"

NPROCESSORS=$(getconf NPROCESSORS_ONLN 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null)
PROCESSORS=${NPROCESSORS:-3}

make -j${PROCESSORS} install

if [ -n "${CI}" ] ; then
    make -j${PROCESSORS} check
fi
