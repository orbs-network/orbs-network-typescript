#!/bin/bash -e

LIBGPG_ERROR_VERSION=1.28
LIBGPG_ERROR_PACKAGE="libgpg-error-${LIBGPG_ERROR_VERSION}"
LIBGPG_ERROR_PACKAGE_FILENAME="${LIBGPG_ERROR_PACKAGE}.tar.bz2"
LIBGPG_ERROR_SHA256="3edb957744905412f30de3e25da18682cbe509541e18cd3b8f9df695a075da49"

# Download the package.
if [ ! -e ${LIBGPG_ERROR_PACKAGE_FILENAME} ] ; then
	echo "Downloading ${LIBGPG_ERROR_PACKAGE_FILENAME}"
    curl -O https://www.gnupg.org/ftp/gcrypt/libgpg-error/${LIBGPG_ERROR_PACKAGE_FILENAME}
else
	echo "Using ${LIBGPG_ERROR_PACKAGE_FILENAME}"
fi

# Verify the SHA256 of the package.
echo "${LIBGPG_ERROR_SHA256}  ${LIBGPG_ERROR_PACKAGE_FILENAME}" | shasum -a256 -c
if [ $? != 0 ] ; then
  echo "${LIBGPG_ERROR_PACKAGE_FILENAME} verification has failed!"
  exit 1
else
  echo "${LIBGPG_ERROR_PACKAGE_FILENAME} has been verified successfully"
fi

# Extract the package
tar -jxvf ${LIBGPG_ERROR_PACKAGE_FILENAME}
