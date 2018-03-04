file(GLOB CRYPTO_SDK_SRC
    "*.h"
    "*.cpp"
)

add_library(crypto STATIC ${CRYPTO_SDK_SRC})

target_include_directories(crypto PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
