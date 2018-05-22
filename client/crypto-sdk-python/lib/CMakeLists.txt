cmake_minimum_required(VERSION 3.6)

file(GLOB CRYPTO_SDK_SRC
  "*.h"
  "*.cpp"
)

PYTHON_ADD_MODULE(pycrypto ${CRYPTO_SDK_SRC})

if(APPLE)
    set(CRYPTO_SDK_LIBRARY ${CMAKE_SOURCE_DIR}/build/${PLATFORM}/libcryptosdk.dylib)
else()
    set(CRYPTO_SDK_LIBRARY ${CMAKE_SOURCE_DIR}/build/${PLATFORM}/libcryptosdk.so)
endif()

target_include_directories(pycrypto PUBLIC
    ${Boost_INCLUDE_DIRS}
    ${PYTHON_INCLUDE_DIRS}
)
target_link_libraries(pycrypto LINK_PUBLIC
    ${CRYPTO_SDK_LIBRARY}
    ${Boost_LIBRARIES}
    ${PYTHON_LIBRARIES}
)
