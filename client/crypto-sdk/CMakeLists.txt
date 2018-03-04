cmake_minimum_required(VERSION 3.10)

find_package(PkgConfig)

project(crypto-sdk)

set(CMAKE_INCLUDE_CURRENT_DIR ON)

add_subdirectory(lib)
add_subdirectory(test)
