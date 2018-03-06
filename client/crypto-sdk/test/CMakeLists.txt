include(../gtest.cmake)

file(GLOB CRYPTO_SDK_TEST_SRC
    "*.h"
    "*.cpp"
)

add_executable(crypto-test ${CRYPTO_SDK_TEST_SRC})
add_dependencies(crypto-test googletest)

target_link_libraries(crypto-test LINK_PUBLIC crypto ${GTEST_LIBRARY} ${GMOCK_LIBRARY})

# Tell ctest about my tests
include(GoogleTest)
gtest_discover_tests(crypto-test TEST_LIST crypto-test-targets)

# Set each target to timeout if not finished within 10 sec.
set_tests_properties(${crypto-test-targets} PROPERTIES TIMEOUT 10)
