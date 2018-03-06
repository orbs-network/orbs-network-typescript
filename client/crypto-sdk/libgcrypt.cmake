find_package(Threads REQUIRED)

set(LIBGCRYPT_VERSION 1.8.2)

include(ExternalProject)
ExternalProject_Add(libgcrypt
  DEPENDS libgpg-error
  URL "https://www.gnupg.org/ftp/gcrypt/libgcrypt/libgcrypt-${LIBGCRYPT_VERSION}.tar.bz2"
  URL_HASH SHA256=c8064cae7558144b13ef0eb87093412380efa16c4ee30ad12ecb54886a524c07
  CONFIGURE_COMMAND <SOURCE_DIR>/configure
    --host=${TARGET_ARCH}
    --prefix=${TARGET_DIR}
    --with-gpg-error-prefix=${TARGET_DIR}
    --disable-shared
    --disable-asm
  BUILD_COMMAND make
  TEST_COMMAND make check
  UPDATE_COMMAND ""
  INSTALL_COMMAND ""
  LOG_DOWNLOAD ON
  LOG_UPDATE ON
  LOG_CONFIGURE ON
  LOG_BUILD ON
  LOG_INSTALL ON
)

ExternalProject_Get_Property(libgcrypt INSTALL_DIR)
set(LIBGCRYPT_DIR ${INSTALL_DIR})
include_directories(${LIBGCRYPT_DIR}/src/libgcrypt/src/libgcrypt/include)

add_library(gcrypt STATIC IMPORTED)
set_property(TARGET gcrypt PROPERTY IMPORTED_LOCATION ${LIBGCRYPT_DIR}/src/libgcrypt/src/libgcrypt/.libs/libgcrypt.a)
