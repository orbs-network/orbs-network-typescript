#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/address.h"
#include "../lib/crypto-sdk.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(crypto_sdk_address, creates_address_from_public_key) {
    uint8_t rawData[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    address_t a;
    int res = crypto_address_create(rawData, sizeof(rawData) - 1, &a);
    EXPECT_EQ(res, 0);
    EXPECT_TRUE(*reinterpret_cast<void **>(a) != NULL);
    crypto_address_free(&a);
}

TEST(crypto_sdk_address, returns_an_error_on_invalid_public_key) {
    int res;

    address_t a;

    // Empty.
    res = crypto_address_create(NULL, 0, &a);
    EXPECT_EQ(res, -1);

    uint8_t rawData[] = "";
    res = crypto_address_create(rawData, sizeof(rawData) - 1, &a);
    EXPECT_EQ(res, -1);

    // Too short.
    uint8_t rawData2[] = "\x12\33";
    res = crypto_address_create(rawData2, sizeof(rawData2) - 1, &a);
    EXPECT_EQ(res, -1);

    // Longer by one character.
    uint8_t rawData3[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65\x12";
    res = crypto_address_create(rawData3, sizeof(rawData3) - 1, &a);
    EXPECT_EQ(res, -1);

    // Shorter by one character.
    uint8_t rawData4[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c";
    res = crypto_address_create(rawData4, sizeof(rawData4) - 1, &a);
    EXPECT_EQ(res, -1);
}

TEST(crypto_sdk_address, converts_address_to_string) {
    uint8_t rawData[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    address_t a;
    int res = crypto_address_create(rawData, sizeof(rawData) - 1, &a);
    EXPECT_EQ(res, 0);

    char publicAddress[Address::ADDRESS_LENGTH + 1];
    res = crypto_address_to_string(a, publicAddress, sizeof(publicAddress));
    EXPECT_EQ(res, 0);
    EXPECT_STREQ(publicAddress, "1JcVJcBXwqeVcC8T2nTpG2dT6xGzhdrHai");

    crypto_address_free(&a);
}

TEST(crypto_sdk_address, returns_an_error_on_invalid_arguments_converts_address_to_string) {
    int res;
    char publicAddress[Address::ADDRESS_LENGTH + 1];

    uint8_t rawData[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    address_t a;
    res = crypto_address_create(rawData, sizeof(rawData) - 1, &a);
    EXPECT_EQ(res, 0);

    // No address.
    res = crypto_address_to_string(NULL, publicAddress, sizeof(publicAddress));
    EXPECT_EQ(res, -1);

    // No public address.
    res = crypto_address_to_string(a, NULL, sizeof(publicAddress));
    EXPECT_EQ(res, -1);

    // Too short.
    res = crypto_address_to_string(a, publicAddress, sizeof(publicAddress) - 1);
    EXPECT_EQ(res, -1);
}
