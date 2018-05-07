cmake_minimum_required(VERSION 3.6)

set(CMAKE_CXX_STANDARD 11)

file(GLOB CRYPTO_SDK_ANDROID_SRC
  "src/main/cpp/*.h"§
  "src/main/cpp/*.cpp"
)

set(CRYPTO_SDK_LIBRARY ${CMAKE_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libcryptosdk.so)

if(ANDROID_ABI)
    set(CRYPTO_SDK_LIBRARY ${CMAKE_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libcryptosdk.so)
else()
    # Ensure jni.h is found for local builds.
    find_package(JNI REQUIRED)
    include_directories(${JNI_INCLUDE_DIRS})

    if(APPLE)
        set(CRYPTO_SDK_LIBRARY ${CMAKE_SOURCE_DIR}/src/main/jniLibs/mac/libcryptosdk.dylib)
    else()
        set(CRYPTO_SDK_LIBRARY ${CMAKE_SOURCE_DIR}/src/main/jniLibs/linux/libcryptosdk.so)
    endif()
endif()

add_library(cryptosdk-android SHARED ${CRYPTO_SDK_ANDROID_SRC})
target_link_libraries(cryptosdk-android ${CRYPTO_SDK_LIBRARY})
