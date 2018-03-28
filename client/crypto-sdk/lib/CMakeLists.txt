file(GLOB CRYPTO_SDK_SRC
  "*.h"
  "*.cpp"
)

set(LIBGPG_ERROR_DIR ${CMAKE_BINARY_DIR}/libgpg-error)
set(LIBGPG_ERROR_LIBRARY ${LIBGPG_ERROR_DIR}/lib/libgpg-error.a)
set(LIBGPG_ERROR_INCLUDE_DIRS ${LIBGPG_ERROR_DIR}/include/)

set(LIBGCRYPT_DIR ${CMAKE_BINARY_DIR}/libgcrypt)
set(LIBGCRYPT_LIBRARY ${LIBGCRYPT_DIR}/lib/libgcrypt.a)
set(LIBGCRYPT_INCLUDE_DIRS ${LIBGCRYPT_DIR}/include/)

add_library(crypto STATIC ${CRYPTO_SDK_SRC})

target_include_directories(crypto PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}
  ${LIBGPG_ERROR_INCLUDE_DIRS}
  ${LIBGCRYPT_INCLUDE_DIRS}
)

target_link_libraries(crypto LINK_PUBLIC
  ${LIBGPG_ERROR_LIBRARY}
  ${LIBGCRYPT_LIBRARY}
)
