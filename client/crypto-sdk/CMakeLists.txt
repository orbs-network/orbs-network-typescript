cmake_minimum_required(VERSION 3.10)

find_package(PkgConfig)

project(crypto-sdk)

set(CMAKE_INCLUDE_CURRENT_DIR ON)

add_subdirectory(lib)
add_subdirectory(test)

execute_process (
    COMMAND bash -c "find ./test -type f -print0 | sort -z | xargs -0 shasum -a512 | shasum -a512"
    OUTPUT_VARIABLE CHECKSUM_VARIABLE
)
message("Test hash is: ${CHECKSUM_VARIABLE}")
