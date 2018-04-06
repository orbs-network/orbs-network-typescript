cmake_minimum_required(VERSION 3.6)

file(GLOB CRYPTO_SDK_ANDROID_SRC
  "src/main/cpp/*.h"
  "src/main/cpp/*.cpp"
)

set(CRYPTO_SDK_LIBRARY ${CMAKE_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libcryptosdk.so)

add_library(cryptosdk-android SHARED ${CRYPTO_SDK_ANDROID_SRC})
target_link_libraries(cryptosdk-android ${CRYPTO_SDK_LIBRARY})
