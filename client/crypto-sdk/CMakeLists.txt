cmake_minimum_required(VERSION 3.6)

find_package(PkgConfig)
find_package(Git)

if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif(NOT CMAKE_BUILD_TYPE)
message("CMAKE_BUILD_TYPE is ${CMAKE_BUILD_TYPE}")

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall")
set(CMAKE_DEBUG_POSTFIX "d" CACHE STRING "Set debug library postfix" FORCE)

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

  set(BUILD_DIR "android/${ARCH}")
elseif(PLATFORM STREQUAL "IOS")
  set(BUILD_DIR "ios")
elseif(PLATFORM STREQUAL "Mac")
  set(BUILD_DIR "mac")
elseif(PLATFORM STREQUAL "Linux")
  set(BUILD_DIR "linux")
endif()

set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/${BUILD_DIR}/lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/${BUILD_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/${BUILD_DIR}/bin)

set(CI $ENV{CI})

project(crypto-sdk)

set(CMAKE_INCLUDE_CURRENT_DIR ON)

include(TestBigEndian)
TEST_BIG_ENDIAN(IS_BIG_ENDIAN)
if(IS_BIG_ENDIAN)
 message(FATAL_ERROR "Big endian isn't supported at the moment")
endif()

add_subdirectory(lib)

# iOS and Android don't support Google Test test runner.
if(PLATFORM STREQUAL "IOS" OR PLATFORM STREQUAL "ANDROID")
  message("Google Test is unsupported on ${PLATFORM}")
else()
  include(CTest)
  enable_testing()

  add_subdirectory(test)
endif()
