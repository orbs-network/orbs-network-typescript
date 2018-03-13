include(../gtest.cmake)

file(GLOB CRYPTO_SDK_TEST_SRC
  "*.h"
  "*.cpp"
)

add_executable(crypto-test ${CRYPTO_SDK_TEST_SRC})
add_dependencies(crypto-test googletest libgcrypt)

ExternalProject_Get_Property(libgcrypt BINARY_DIR)
set(LIBGCRYPT_LIBRARY ${BINARY_DIR}/src/.libs/libgcrypt.a)
target_link_libraries(crypto-test LINK_PUBLIC crypto ${GTEST_LIBRARY} ${GMOCK_LIBRARY} ${LIBGCRYPT_LIBRARY} gpg-error)

# Tell ctest about my tests.
include(GoogleTest)
gtest_add_tests(TARGET crypto-test TEST_LIST crypto-test-targets)
gtest_add_tests(TARGET crypto-test EXTRA_ARGS --fips TEST_LIST crypto-test-targets TEST_SUFFIX .fips)

# Set each target to timeout if not finished within 10 sec.
set_tests_properties(${crypto-test-targets} PROPERTIES TIMEOUT 30)
