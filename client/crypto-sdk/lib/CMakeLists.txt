file(GLOB CRYPTO_SDK_SRC
  "*.h"
  "*.cpp"
)

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

  set(LIBGPG_ERROR_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/android/libgpg-error)
  set(LIBGPG_ERROR_LIBRARY ${LIBGPG_ERROR_DIR}/${ARCH}/lib/libgpg-error.a)
  set(LIBGPG_ERROR_INCLUDE_DIRS ${LIBGPG_ERROR_DIR}/${ARCH}/include/)

  set(LIBGCRYPT_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/android/libgcrypt)
  set(LIBGCRYPT_LIBRARY ${LIBGCRYPT_DIR}/${ARCH}/lib/libgcrypt.a)
  set(LIBGCRYPT_INCLUDE_DIRS ${LIBGCRYPT_DIR}/${ARCH}/include)
else()
  if(PLATFORM STREQUAL "IOS")
    set(LIBGPG_ERROR_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/ios/libgpg-error)
    set(LIBGCRYPT_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/ios/libgcrypt)
  elseif(PLATFORM STREQUAL "Mac")
    set(LIBGPG_ERROR_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/mac/libgpg-error)
    set(LIBGCRYPT_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/mac/libgcrypt)
  elseif(PLATFORM STREQUAL "Linux")
    set(LIBGPG_ERROR_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/linux/libgpg-error)
    set(LIBGCRYPT_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/linux/libgcrypt)
  endif()

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
