#!/bin/bash -e

function readlink() {
  DIR=$(echo "${1%/*}")
  (cd "$DIR" && echo "$(pwd -P)")
}

LIBGPG_ERROR_VERSION=1.27
LIBGPG_ERROR_PACKAGE="libgpg-error-${LIBGPG_ERROR_VERSION}"

PREFIX="$(pwd)/../../build/libgpg-error/"
mkdir -p ${PREFIX}
PREFIX=$(readlink "${PREFIX}")

cd ${LIBGPG_ERROR_PACKAGE}

make distclean > /dev/null || true

./configure \
    --with-pic \
    --enable-static \
    --disable-shared \
    --disable-nls \
    --disable-languages \
    --prefix="${PREFIX}"

NPROCESSORS=$(getconf NPROCESSORS_ONLN 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null)
PROCESSORS=${NPROCESSORS:-3}

make -j${PROCESSORS} install

if [ -n "${CI}" ] ; then
    make -j${PROCESSORS} check
fi
