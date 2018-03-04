find_package(Threads REQUIRED)

set(LIBSODIUM_VERSION 1.0.16)

include(ExternalProject)
ExternalProject_Add(
  libsodium
  GIT_REPOSITORY https://github.com/jedisct1/libsodium.git
  GIT_TAG ${LIBSODIUM_VERSION}
  BUILD_IN_SOURCE ON
  CONFIGURE_COMMAND <SOURCE_DIR>/autogen.sh
  BUILD_COMMAND <SOURCE_DIR>/configure  --prefix=<INSTALL_DIR>
  INSTALL_COMMAND make -j4
  TEST_COMMAND make -j4 check
  LOG_DOWNLOAD ON
  LOG_CONFIGURE ON
  LOG_BUILD ON)

ExternalProject_Get_Property(libsodium INSTALL_DIR)
set(NACL_DIR ${INSTALL_DIR})
include_directories(${NACL_DIR}/src/libsodium/src/libsodium/include)

add_library(nacl_lib STATIC IMPORTED)
set_property(TARGET nacl_lib PROPERTY IMPORTED_LOCATION ${NACL_DIR}/src/libsodium/src/libsodium/.libs/libsodium.a)
