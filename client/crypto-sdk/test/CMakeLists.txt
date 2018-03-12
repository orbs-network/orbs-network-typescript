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

# Tell ctest about my tests
include(GoogleTest)
gtest_discover_tests(crypto-test TEST_LIST crypto-test-targets)

# Set each target to timeout if not finished within 10 sec.
set_tests_properties(${crypto-test-targets} PROPERTIES TIMEOUT 10)
