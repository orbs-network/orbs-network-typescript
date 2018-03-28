#!/bin/bash -e

LIBGCRYPT_VERSION=1.8.2
LIBGCRYPT_PACKAGE="libgcrypt-${LIBGCRYPT_VERSION}"
LIBGCRYPT_PACKAGE_FILENAME="${LIBGCRYPT_PACKAGE}.tar.bz2"
LIBGCRYPT_SHA256="c8064cae7558144b13ef0eb87093412380efa16c4ee30ad12ecb54886a524c07"

# Download the package.
if [ ! -e ${LIBGCRYPT_PACKAGE_FILENAME} ]; then
	echo "Downloading ${LIBGCRYPT_PACKAGE_FILENAME}"
    curl -O https://www.gnupg.org/ftp/gcrypt/libgcrypt/${LIBGCRYPT_PACKAGE_FILENAME}
else
	echo "Using ${LIBGCRYPT_PACKAGE_FILENAME}"
fi

# Verify the SHA256 of the package.
echo "${LIBGCRYPT_SHA256}  ${LIBGCRYPT_PACKAGE_FILENAME}" | shasum -a256 -c
if [ $? != 0 ]; then
  echo "${LIBGCRYPT_PACKAGE_FILENAME} verification has failed!"
  exit 1
else
  echo "${LIBGCRYPT_PACKAGE_FILENAME} has been verified successfully"
fi

# Extract the package
tar xvzf ${LIBGCRYPT_PACKAGE_FILENAME}
