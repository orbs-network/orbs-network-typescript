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

add_library(cryptosdk SHARED ${CRYPTO_SDK_SRC})

target_include_directories(cryptosdk PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}
  ${LIBGCRYPT_INCLUDE_DIRS}
  ${LIBGPG_ERROR_INCLUDE_DIRS}
)

target_link_libraries(cryptosdk LINK_PUBLIC
  ${LIBGCRYPT_LIBRARY}
  ${LIBGPG_ERROR_LIBRARY}
)
