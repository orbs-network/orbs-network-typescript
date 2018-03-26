set(LIBGPG_ERROR_VERSION 1.27)

if(CI)
  set(LIBGPG_ERROR_TEST_COMMAND make check)
else()
  message("Skipping libgpg-error tests...")
endif()

include(ExternalProject)
ExternalProject_Add(libgpg-error
  URL "https://www.gnupg.org/ftp/gcrypt/libgpg-error/libgpg-error-${LIBGPG_ERROR_VERSION}.tar.bz2"
  URL_HASH SHA256=4f93aac6fecb7da2b92871bb9ee33032be6a87b174f54abf8ddf0911a22d29d2
  CONFIGURE_COMMAND <SOURCE_DIR>/configure
    --host=${TARGET_ARCH}
    --prefix=${TARGET_DIR}
    --with-pic
    --enable-static
    --disable-shared
    --disable-nls
    --disable-languages
  BUILD_COMMAND make
  TEST_COMMAND ${LIBGPG_ERROR_TEST_COMMAND}
  UPDATE_COMMAND ""
  INSTALL_COMMAND ""
  LOG_DOWNLOAD ON
  LOG_UPDATE ON
  LOG_CONFIGURE ON
  LOG_BUILD ON
  LOG_INSTALL ON
)

ExternalProject_Get_Property(libgpg-error BINARY_DIR)
set(LIBGPG_ERROR_INCLUDE_DIRS ${BINARY_DIR}/src/)

ExternalProject_Add_Step(libgpg-error post-install
  DEPENDEES install
  COMMAND
    mkdir -p ${BINARY_DIR}/src/bin && cp ${BINARY_DIR}/src/gpg-error-config ${BINARY_DIR}/src/bin &&
    ln -fs ${BINARY_DIR}/src/gpg-error.h /usr/local/include/gpg-error.h &&
    ln -fs ${BINARY_DIR}/src/.libs/libgpg-error.a /usr/local/lib/libgpg-error.a
)

# The cloning of the above repo doesn't happen until make, however if the dir doesn't exist,
# INTERFACE_INCLUDE_DIRECTORIES will throw an error. To make it work, we just create the directory now during config.
file(MAKE_DIRECTORY ${LIBGPG_ERROR_INCLUDE_DIRS})

set(LIBGPG_ERROR_LIBRARY_PATH ${BINARY_DIR}/src/.libs/libgpg-error.a)
set(LIBGPG_ERROR_LIBRARY gpg-error)
add_library(${LIBGPG_ERROR_LIBRARY} SHARED IMPORTED)
set_target_properties(${LIBGPG_ERROR_LIBRARY} PROPERTIES
  "IMPORTED_LOCATION" "${LIBGPG_ERROR_LIBRARY_PATH}"
  "IMPORTED_LINK_INTERFACE_LIBRARIES" "${CMAKE_THREAD_LIBS_INIT}"
  "INTERFACE_INCLUDE_DIRECTORIES" "${LIBGPG_ERROR_INCLUDE_DIRS}")
add_dependencies(${LIBGPG_ERROR_LIBRARY} libgpg-error)
