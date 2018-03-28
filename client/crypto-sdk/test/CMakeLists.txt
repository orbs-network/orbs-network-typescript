include(../gtest.cmake)

file(GLOB CRYPTO_SDK_TEST_SRC
  "*.h"
  "*.cpp"
)

set(LIBGPG_ERROR_DIR ${CMAKE_BINARY_DIR}/libgpg-error)
set(LIBGPG_ERROR_LIBRARY ${LIBGPG_ERROR_DIR}/lib/libgpg-error.a)

set(LIBGCRYPT_DIR ${CMAKE_BINARY_DIR}/libgcrypt)
set(LIBGCRYPT_LIBRARY ${LIBGCRYPT_DIR}/lib/libgcrypt.a)

add_executable(crypto-test ${CRYPTO_SDK_TEST_SRC})

target_link_libraries(crypto-test LINK_PUBLIC crypto
  ${GTEST_LIBRARY}
  ${GMOCK_LIBRARY}
  ${LIBGCRYPT_LIBRARY}
  ${LIBGPG_ERROR_LIBRARY}
)

# Tell ctest about my tests.
include(GoogleTest)
gtest_add_tests(TARGET crypto-test TEST_LIST crypto-test-targets)
gtest_add_tests(TARGET crypto-test EXTRA_ARGS --fips TEST_LIST crypto-test-targets TEST_SUFFIX .fips)

# Set each target to timeout if not finished within 10 sec.
set_tests_properties(${crypto-test-targets} PROPERTIES TIMEOUT 10)
