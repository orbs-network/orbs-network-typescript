include(../gtest.cmake)

file(GLOB CRYPTO_SDK_TEST_SRC
  "*.h"
  "*.cpp"
)

if(PLATFORM STREQUAL "Mac")
  set(LIBGPG_ERROR_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/Mac/libgpg-error)
  set(LIBGCRYPT_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/Mac/libgcrypt)
elseif(PLATFORM STREQUAL "Linux")
  set(LIBGPG_ERROR_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/Linux/libgpg-error)
  set(LIBGCRYPT_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../build/Linux/libgcrypt)
endif()

set(LIBGPG_ERROR_LIBRARY ${LIBGPG_ERROR_DIR}/lib/libgpg-error.a)
set(LIBGCRYPT_LIBRARY ${LIBGCRYPT_DIR}/lib/libgcrypt.a)

add_executable(crypto-test ${CRYPTO_SDK_TEST_SRC})

target_link_libraries(crypto-test LINK_PUBLIC
  cryptosdk
  ${GTEST_LIBRARY}
  ${GMOCK_LIBRARY}
  ${LIBGCRYPT_LIBRARY}
  ${LIBGPG_ERROR_LIBRARY}
)

# Tell ctest about my tests.
include(GoogleTest)
gtest_add_tests(TARGET crypto-test TEST_LIST crypto-test-targets)

# Set each target to timeout if not finished within 10 sec.
set_tests_properties(${crypto-test-targets} PROPERTIES TIMEOUT 10)
