find_package(Threads REQUIRED)

set(LIBGCRYPT_VERSION 1.8.2)

ExternalProject_Get_Property(libgpg-error BINARY_DIR)

include(ExternalProject)
ExternalProject_Add(libgcrypt
  DEPENDS libgpg-error
  URL "https://www.gnupg.org/ftp/gcrypt/libgcrypt/libgcrypt-${LIBGCRYPT_VERSION}.tar.bz2"
  URL_HASH SHA256=c8064cae7558144b13ef0eb87093412380efa16c4ee30ad12ecb54886a524c07
  CONFIGURE_COMMAND <SOURCE_DIR>/configure
    --host=${TARGET_ARCH}
    --prefix=${TARGET_DIR}
    --with-gpg-error-prefix=${BINARY_DIR}/src
    --with-pic
    --disable-shared
    --enable-static
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

ExternalProject_Get_Property(libgcrypt BINARY_DIR)
set(LIBGCRYPT_INCLUDE_DIRS ${BINARY_DIR}/src/)

# The cloning of the above repo doesn't happen until make, however if the dir doesn't exist,
# INTERFACE_INCLUDE_DIRECTORIES will throw an error. To make it work, we just create the directory now during config.
file(MAKE_DIRECTORY ${LIBGCRYPT_INCLUDE_DIRS})

set(LIBGCRYPT_LIBRARY_PATH ${BINARY_DIR}/src/.libs/libgcrypt.a)
set(LIBGCRYPT_LIBRARY gcrypt)
add_library(${LIBGCRYPT_LIBRARY} SHARED IMPORTED)
set_target_properties(${LIBGCRYPT_LIBRARY} PROPERTIES
  "IMPORTED_LOCATION" "${LIBGCRYPT_LIBRARY_PATH}"
  "IMPORTED_LINK_INTERFACE_LIBRARIES" "${CMAKE_THREAD_LIBS_INIT}"
  "INTERFACE_INCLUDE_DIRECTORIES" "${LIBGCRYPT_INCLUDE_DIRS}")
add_dependencies(${LIBGCRYPT_LIBRARY} libgcrypt)
