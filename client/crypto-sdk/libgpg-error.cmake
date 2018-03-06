find_package(Threads REQUIRED)

set(LIBGPG_ERROR_VERSION 1.27)

include(ExternalProject)
ExternalProject_Add(libgpg-error
  URL "https://www.gnupg.org/ftp/gcrypt/libgpg-error/libgpg-error-1.27.tar.bz2"
  URL_HASH SHA256=4f93aac6fecb7da2b92871bb9ee33032be6a87b174f54abf8ddf0911a22d29d2
  CONFIGURE_COMMAND <SOURCE_DIR>/configure
    --host=${TARGET_ARCH}
    --prefix=${TARGET_DIR}
    --disable-shared
    --disable-nls
    --disable-languages
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
