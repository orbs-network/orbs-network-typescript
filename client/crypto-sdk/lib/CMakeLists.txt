file(GLOB CRYPTO_SDK_SRC
  "*.h"
  "*.cpp"
)

set(LIBGPG_ERROR_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/libgpg-error)
set(LIBGCRYPT_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/libgcrypt)

# Currently, there is not support for universal/fat libraries on Android.
if(PLATFORM STREQUAL "ANDROID")
  if(ANDROID_ABI STREQUAL "armeabi-v7a")
    set(ARCH "armv7-a")
  elseif(ANDROID_ABI STREQUAL "arm64-v8a")
    set(ARCH "armv8-a")
  elseif(ANDROID_ABI STREQUAL "x86")
    set(ARCH "i686")
  elseif(ANDROID_ABI STREQUAL "x86_64")
    set(ARCH "westmere")
  else()
    message(FATAL_ERROR "Unsupported Android architecture: ${ANDROID_ABI}")
  endif()

  set(LIBGPG_ERROR_LIBRARY ${LIBGPG_ERROR_DIR}/android/${ARCH}/lib/libgpg-error.a)
  set(LIBGPG_ERROR_INCLUDE_DIRS ${LIBGPG_ERROR_DIR}/android/${ARCH}/include/)
  set(LIBGCRYPT_LIBRARY ${LIBGCRYPT_DIR}/android/${ARCH}/lib/libgcrypt.a)
  set(LIBGCRYPT_INCLUDE_DIRS ${LIBGCRYPT_DIR}/android/${ARCH}/include)
else()
  set(LIBGPG_ERROR_LIBRARY ${LIBGPG_ERROR_DIR}/lib/libgpg-error.a)
  set(LIBGPG_ERROR_INCLUDE_DIRS ${LIBGPG_ERROR_DIR}/include/)
  set(LIBGCRYPT_LIBRARY ${LIBGCRYPT_DIR}/lib/libgcrypt.a)
  set(LIBGCRYPT_INCLUDE_DIRS ${LIBGCRYPT_DIR}/include)
endif()

add_library(cryptosdk SHARED ${CRYPTO_SDK_SRC})

target_include_directories(cryptosdk PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}
  ${LIBGPG_ERROR_INCLUDE_DIRS}
  ${LIBGCRYPT_INCLUDE_DIRS}
)

target_link_libraries(cryptosdk LINK_PUBLIC
  ${LIBGCRYPT_LIBRARY}
  ${LIBGPG_ERROR_LIBRARY}
)
