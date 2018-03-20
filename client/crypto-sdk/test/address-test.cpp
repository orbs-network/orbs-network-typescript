#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/address.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(Address, creates_from_public_key) {
    vector<uint8_t> publicKey;

    uint8_t rawData[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    publicKey = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    Address a1(publicKey);

    EXPECT_EQ(a1.GetVersion(), 0);
    EXPECT_THAT(a1.GetAccountId(), ElementsAreArray("\xc1\x30\x52\xd8\x20\x82\x30\xa5\x8a\xb3\x63\x70\x8c\x08\xe7\x8f\x11\x25\xf4\x88", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a1.GetChecksum(), ElementsAreArray("\x50\xf8\x65\x8b", Address::CHECKSUM_SIZE));

    uint8_t rawData2[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    publicKey = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    Address a2(publicKey);

    EXPECT_EQ(a2.GetVersion(), 0);
    EXPECT_THAT(a2.GetAccountId(), ElementsAreArray("\x44\x06\x8a\xcc\x1b\x9f\xfc\x07\x26\x94\xb6\x84\xfc\x11\xff\x22\x9a\xff\x0b\x28", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a2.GetChecksum(), ElementsAreArray("\x1f\xe5\x41\x34", Address::CHECKSUM_SIZE));
}

TEST(Address, converts_to_string) {
    vector<uint8_t> publicKey;
    string publicAddress;

    uint8_t rawData[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    publicKey = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    Address a1(publicKey);
    EXPECT_STREQ(a1.ToString().c_str(), "1JcVJcBXwqeVcC8T2nTpG2dT6xGzhdrHai");

    uint8_t rawData2[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    publicKey = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    Address a2(publicKey);
    EXPECT_STREQ(a2.ToString().c_str(), "17Cgnby8KJC9ZwF8dRgYCKnT1ZXDPNYSkB");
}

TEST(Address, throws_on_invalid_public_key) {
    vector<uint8_t> publicKey;

    // Empty.
    uint8_t rawData[] = "";
    publicKey = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    EXPECT_THROW(Address a1(publicKey), invalid_argument);

    // Too short.
    uint8_t rawData2[] = "\x12\33";
    publicKey = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    EXPECT_THROW(Address a2(publicKey), invalid_argument);

    // Longer by one character.
    uint8_t rawData3[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65\x12";
    publicKey = vector<uint8_t>(rawData3, rawData3 + sizeof(rawData3) - 1);
    EXPECT_THROW(Address a3(publicKey), invalid_argument);

    // Shorter by one character.
    uint8_t rawData4[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c";
    publicKey = vector<uint8_t>(rawData4, rawData4 + sizeof(rawData4) - 1);
    EXPECT_THROW(Address a4(publicKey), invalid_argument);
}

TEST(Address, verifies_account_public_address) {
    string address;

    // Empty.
    EXPECT_FALSE(Address::IsValid(""));

    // Too short.
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8T2nTpG2dT6xGzhdrHa"));
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8T2nTpG2dT6xGzhdrH"));

    // Too long.
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8T2nTpG2dT6xGzhdrHaia"));
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8T2nTpG2dT6xGzhdrHaiaa"));

    // Invalid BASE58.
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcCOT2nTpG2dT6xGzhdrHai"));
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8T2nTpG2dI6xGzhdrHai"));
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8T0nTpG2dT6xGzhdrHai"));
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8TlnTpG2dT6xGzhdrHai"));
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8T2nTpG2dT6xGzhd+Hai"));
    EXPECT_FALSE(Address::IsValid("1JcVJc/XwqeVcC8T2nTpG2dT6xGzhdrHai"));

    // Incorrect version.
    EXPECT_FALSE(Address::IsValid("hx6HiUpf27NRdGY4Co8k9uEjTXwU6UqQx"));
    EXPECT_FALSE(Address::IsValid("27HhGpn7NCaFF4Qd5d8TEHB2MxntAeBZpH"));

    // Incorrect checksum.
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8T2nTpG2dT6xGzhfLGs4"));
    EXPECT_FALSE(Address::IsValid("1JcVJcBXwqeVcC8T2nTpG2dT6xGzkB1uBb"));

    // Correct addresses.
    EXPECT_TRUE(Address::IsValid("1JcVJcBXwqeVcC8T2nTpG2dT6xGzhdrHai"));
    EXPECT_TRUE(Address::IsValid("17Cgnby8KJC9ZwF8dRgYCKnT1ZXDPNYSkB"));
}
