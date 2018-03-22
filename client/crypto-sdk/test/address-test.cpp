#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/crypto.h"
#include "../lib/address.h"
#include "../lib/ed25519key.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(Address, creates_from_binary_public_key) {
    vector<uint8_t> publicKey;
    vector<uint8_t> virtualChainId;

    uint8_t rawPublicKey[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey, rawPublicKey + sizeof(rawPublicKey) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId, rawVirtualChainId + sizeof(rawVirtualChainId) - 1);
    Address a1(publicKey, virtualChainId, Address::MAIN_NETWORK_ID);

    EXPECT_EQ(a1.GetVersion(), 0);
    EXPECT_EQ(a1.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a1.GetVirtualChainId(), ElementsAreArray("\x64\x0e\xd3", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a1.GetAccountId(), ElementsAreArray("\xc1\x30\x52\xd8\x20\x82\x30\xa5\x8a\xb3\x63\x70\x8c\x08\xe7\x8f\x11\x25\xf4\x88", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a1.GetChecksum(), ElementsAreArray("\x61\xf0\x4b\xfc", Address::CHECKSUM_SIZE));

    uint8_t rawPublicKey2[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId2[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey2, rawPublicKey2 + sizeof(rawPublicKey2) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId2, rawVirtualChainId2 + sizeof(rawVirtualChainId2) - 1);
    Address a2(publicKey, virtualChainId, Address::TEST_NETWORK_ID);

    EXPECT_EQ(a2.GetVersion(), 0);
    EXPECT_EQ(a2.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a2.GetVirtualChainId(), ElementsAreArray("\x64\x0e\xd3", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a2.GetAccountId(), ElementsAreArray("\xc1\x30\x52\xd8\x20\x82\x30\xa5\x8a\xb3\x63\x70\x8c\x08\xe7\x8f\x11\x25\xf4\x88", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a2.GetChecksum(), ElementsAreArray("\x26\x20\xb4\xed", Address::CHECKSUM_SIZE));

    uint8_t rawPublicKey3[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    uint8_t rawVirtualChainId3[] = "\x90\x12\xca";
    publicKey = vector<uint8_t>(rawPublicKey3, rawPublicKey3 + sizeof(rawPublicKey3) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId3, rawVirtualChainId3 + sizeof(rawVirtualChainId3) - 1);
    Address a3(publicKey, virtualChainId, Address::MAIN_NETWORK_ID);

    EXPECT_EQ(a3.GetVersion(), 0);
    EXPECT_EQ(a3.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a3.GetVirtualChainId(), ElementsAreArray("\x90\x12\xca", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a3.GetAccountId(), ElementsAreArray("\x44\x06\x8a\xcc\x1b\x9f\xfc\x07\x26\x94\xb6\x84\xfc\x11\xff\x22\x9a\xff\x0b\x28", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a3.GetChecksum(), ElementsAreArray("\x9e\xa1\x08\x11", Address::CHECKSUM_SIZE));

    uint8_t rawPublicKey4[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    uint8_t rawVirtualChainId4[] = "\x90\x12\xca";
    publicKey = vector<uint8_t>(rawPublicKey4, rawPublicKey4 + sizeof(rawPublicKey4) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId4, rawVirtualChainId4 + sizeof(rawVirtualChainId4) - 1);
    Address a4(publicKey, virtualChainId, Address::TEST_NETWORK_ID);

    EXPECT_EQ(a4.GetVersion(), 0);
    EXPECT_EQ(a4.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a4.GetVirtualChainId(), ElementsAreArray("\x90\x12\xca", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a4.GetAccountId(), ElementsAreArray("\x44\x06\x8a\xcc\x1b\x9f\xfc\x07\x26\x94\xb6\x84\xfc\x11\xff\x22\x9a\xff\x0b\x28", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a4.GetChecksum(), ElementsAreArray("\xd9\x71\xf7\x00", Address::CHECKSUM_SIZE));
}

TEST(Address, creates_from_ed25519_key) {
    if (CryptoSDK::isFIPSMode()) {
        EXPECT_THROW(ED25519Key key, runtime_error);
        return;
    }

    vector<uint8_t> publicKey;
    vector<uint8_t> virtualChainId;

    uint8_t rawPublicKey[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey, rawPublicKey + sizeof(rawPublicKey) - 1);
    ED25519Key key1(publicKey);
    virtualChainId = vector<uint8_t>(rawVirtualChainId, rawVirtualChainId + sizeof(rawVirtualChainId) - 1);
    Address a1(key1, virtualChainId, Address::MAIN_NETWORK_ID);

    EXPECT_EQ(a1.GetVersion(), 0);
    EXPECT_EQ(a1.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a1.GetVirtualChainId(), ElementsAreArray("\x64\x0e\xd3", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a1.GetAccountId(), ElementsAreArray("\xc1\x30\x52\xd8\x20\x82\x30\xa5\x8a\xb3\x63\x70\x8c\x08\xe7\x8f\x11\x25\xf4\x88", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a1.GetChecksum(), ElementsAreArray("\x61\xf0\x4b\xfc", Address::CHECKSUM_SIZE));

    uint8_t rawPublicKey2[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId2[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey2, rawPublicKey2 + sizeof(rawPublicKey2) - 1);
    ED25519Key key2(publicKey);
    virtualChainId = vector<uint8_t>(rawVirtualChainId2, rawVirtualChainId2 + sizeof(rawVirtualChainId2) - 1);
    Address a2(key2, virtualChainId, Address::TEST_NETWORK_ID);

    EXPECT_EQ(a2.GetVersion(), 0);
    EXPECT_EQ(a2.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a2.GetVirtualChainId(), ElementsAreArray("\x64\x0e\xd3", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a2.GetAccountId(), ElementsAreArray("\xc1\x30\x52\xd8\x20\x82\x30\xa5\x8a\xb3\x63\x70\x8c\x08\xe7\x8f\x11\x25\xf4\x88", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a2.GetChecksum(), ElementsAreArray("\x26\x20\xb4\xed", Address::CHECKSUM_SIZE));

    uint8_t rawPublicKey3[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    uint8_t rawVirtualChainId3[] = "\x90\x12\xca";
    publicKey = vector<uint8_t>(rawPublicKey3, rawPublicKey3 + sizeof(rawPublicKey3) - 1);
    ED25519Key key3(publicKey);
    virtualChainId = vector<uint8_t>(rawVirtualChainId3, rawVirtualChainId3 + sizeof(rawVirtualChainId3) - 1);
    Address a3(key3, virtualChainId, Address::MAIN_NETWORK_ID);

    EXPECT_EQ(a3.GetVersion(), 0);
    EXPECT_EQ(a3.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a3.GetVirtualChainId(), ElementsAreArray("\x90\x12\xca", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a3.GetAccountId(), ElementsAreArray("\x44\x06\x8a\xcc\x1b\x9f\xfc\x07\x26\x94\xb6\x84\xfc\x11\xff\x22\x9a\xff\x0b\x28", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a3.GetChecksum(), ElementsAreArray("\x9e\xa1\x08\x11", Address::CHECKSUM_SIZE));

    uint8_t rawPublicKey4[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    uint8_t rawVirtualChainId4[] = "\x90\x12\xca";
    publicKey = vector<uint8_t>(rawPublicKey4, rawPublicKey4 + sizeof(rawPublicKey4) - 1);
    ED25519Key key4(publicKey);
    virtualChainId = vector<uint8_t>(rawVirtualChainId4, rawVirtualChainId4 + sizeof(rawVirtualChainId4) - 1);
    Address a4(key4, virtualChainId, Address::TEST_NETWORK_ID);

    EXPECT_EQ(a4.GetVersion(), 0);
    EXPECT_EQ(a4.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a4.GetVirtualChainId(), ElementsAreArray("\x90\x12\xca", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a4.GetAccountId(), ElementsAreArray("\x44\x06\x8a\xcc\x1b\x9f\xfc\x07\x26\x94\xb6\x84\xfc\x11\xff\x22\x9a\xff\x0b\x28", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a4.GetChecksum(), ElementsAreArray("\xd9\x71\xf7\x00", Address::CHECKSUM_SIZE));
}

TEST(Address, creates_from_string_public_key) {
    Address a1("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65", "640ed3", "M");

    EXPECT_EQ(a1.GetVersion(), 0);
    EXPECT_EQ(a1.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a1.GetVirtualChainId(), ElementsAreArray("\x64\x0e\xd3", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a1.GetAccountId(), ElementsAreArray("\xc1\x30\x52\xd8\x20\x82\x30\xa5\x8a\xb3\x63\x70\x8c\x08\xe7\x8f\x11\x25\xf4\x88", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a1.GetChecksum(), ElementsAreArray("\x61\xf0\x4b\xfc", Address::CHECKSUM_SIZE));

    Address a2("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65", "640ed3", "T");

    EXPECT_EQ(a2.GetVersion(), 0);
    EXPECT_EQ(a2.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a2.GetVirtualChainId(), ElementsAreArray("\x64\x0e\xd3", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a2.GetAccountId(), ElementsAreArray("\xc1\x30\x52\xd8\x20\x82\x30\xa5\x8a\xb3\x63\x70\x8c\x08\xe7\x8f\x11\x25\xf4\x88", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a2.GetChecksum(), ElementsAreArray("\x26\x20\xb4\xed", Address::CHECKSUM_SIZE));

    Address a3("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6", "9012ca", "M");

    EXPECT_EQ(a3.GetVersion(), 0);
    EXPECT_EQ(a3.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a3.GetVirtualChainId(), ElementsAreArray("\x90\x12\xca", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a3.GetAccountId(), ElementsAreArray("\x44\x06\x8a\xcc\x1b\x9f\xfc\x07\x26\x94\xb6\x84\xfc\x11\xff\x22\x9a\xff\x0b\x28", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a3.GetChecksum(), ElementsAreArray("\x9e\xa1\x08\x11", Address::CHECKSUM_SIZE));

    Address a4("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6", "9012ca", "T");

    EXPECT_EQ(a4.GetVersion(), 0);
    EXPECT_EQ(a4.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a4.GetVirtualChainId(), ElementsAreArray("\x90\x12\xca", Address::VIRTUAL_CHAIN_ID_SIZE));
    EXPECT_THAT(a4.GetAccountId(), ElementsAreArray("\x44\x06\x8a\xcc\x1b\x9f\xfc\x07\x26\x94\xb6\x84\xfc\x11\xff\x22\x9a\xff\x0b\x28", Address::ACCOUNT_ID_SIZE));
    EXPECT_THAT(a4.GetChecksum(), ElementsAreArray("\xd9\x71\xf7\x00", Address::CHECKSUM_SIZE));
}

TEST(Address, converts_to_string) {
    vector<uint8_t> publicKey;
    vector<uint8_t> virtualChainId;
    string publicAddress;

    uint8_t rawPublicKey[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey, rawPublicKey + sizeof(rawPublicKey) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId, rawVirtualChainId + sizeof(rawVirtualChainId) - 1);
    Address a1(publicKey, virtualChainId, Address::MAIN_NETWORK_ID);

    EXPECT_STREQ(a1.ToString().c_str(), "M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu1");

    uint8_t rawPublicKey2[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId2[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey2, rawPublicKey2 + sizeof(rawPublicKey2) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId2, rawVirtualChainId2 + sizeof(rawVirtualChainId2) - 1);
    Address a2(publicKey, virtualChainId, Address::TEST_NETWORK_ID);

    EXPECT_STREQ(a2.ToString().c_str(), "T1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4NjCK6C");

    uint8_t rawPublicKey3[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    uint8_t rawVirtualChainId3[] = "\x90\x12\xca";
    publicKey = vector<uint8_t>(rawPublicKey3, rawPublicKey3 + sizeof(rawPublicKey3) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId3, rawVirtualChainId3 + sizeof(rawVirtualChainId3) - 1);
    Address a3(publicKey, virtualChainId, Address::MAIN_NETWORK_ID);

    EXPECT_STREQ(a3.ToString().c_str(), "M1LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMoNRmxU");

    uint8_t rawPublicKey4[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    uint8_t rawVirtualChainId4[] = "\x90\x12\xca";
    publicKey = vector<uint8_t>(rawPublicKey4, rawPublicKey4 + sizeof(rawPublicKey4) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId4, rawVirtualChainId4 + sizeof(rawVirtualChainId4) - 1);
    Address a4(publicKey, virtualChainId, Address::TEST_NETWORK_ID);

    EXPECT_STREQ(a4.ToString().c_str(), "T1LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMpsdEej");
}

TEST(Address, throws_on_invalid_arguments_on_creation) {
    vector<uint8_t> publicKey;
    vector<uint8_t> virtualChainId;

    // Empty public key.
    uint8_t rawPublicKey[] = "";
    uint8_t rawVirtualChainId[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey, rawPublicKey + sizeof(rawPublicKey) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId, rawVirtualChainId + sizeof(rawVirtualChainId) - 1);

    EXPECT_THROW(Address a1(publicKey, virtualChainId, Address::MAIN_NETWORK_ID), invalid_argument);

    // Public key is too short.
    uint8_t rawPublicKey2[] = "\x12\x33";
    uint8_t rawVirtualChainId2[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey2, rawPublicKey2 + sizeof(rawPublicKey2) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId2, rawVirtualChainId2 + sizeof(rawVirtualChainId2) - 1);

    EXPECT_THROW(Address a2(publicKey, virtualChainId, Address::MAIN_NETWORK_ID), invalid_argument);

    // Public key is longer by one character.
    uint8_t rawPublicKey3[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65\x12";
    uint8_t rawVirtualChainId3[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey3, rawPublicKey3 + sizeof(rawPublicKey3) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId3, rawVirtualChainId3 + sizeof(rawVirtualChainId3) - 1);

    EXPECT_THROW(Address a3(publicKey, virtualChainId, Address::MAIN_NETWORK_ID), invalid_argument);

    // Public key is shorter by one character.
    uint8_t rawPublicKey4[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c";
    uint8_t rawVirtualChainId4[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey4, rawPublicKey4 + sizeof(rawPublicKey4) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId4, rawVirtualChainId4 + sizeof(rawVirtualChainId4) - 1);

    EXPECT_THROW(Address a4(publicKey, virtualChainId, Address::MAIN_NETWORK_ID), invalid_argument);

    // Virtual chain ID is empty.
    uint8_t rawPublicKey5[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId5[] = "";
    publicKey = vector<uint8_t>(rawPublicKey5, rawPublicKey5 + sizeof(rawPublicKey5) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId5, rawVirtualChainId5 + sizeof(rawVirtualChainId5) - 1);

    EXPECT_THROW(Address a5(publicKey, virtualChainId, Address::MAIN_NETWORK_ID), invalid_argument);

    // Virtual chain ID is too short.
    uint8_t rawPublicKey6[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId6[] = "\x64\x0e";
    publicKey = vector<uint8_t>(rawPublicKey6, rawPublicKey6 + sizeof(rawPublicKey6) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId6, rawVirtualChainId6 + sizeof(rawVirtualChainId6) - 1);

    EXPECT_THROW(Address a6(publicKey, virtualChainId, Address::MAIN_NETWORK_ID), invalid_argument);

    // Virtual chain ID is too long.
    uint8_t rawPublicKey7[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId7[] = "\x64\x0e\xd3\x48";
    publicKey = vector<uint8_t>(rawPublicKey7, rawPublicKey7 + sizeof(rawPublicKey7) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId7, rawVirtualChainId7 + sizeof(rawVirtualChainId7) - 1);

    EXPECT_THROW(Address a7(publicKey, virtualChainId, Address::MAIN_NETWORK_ID), invalid_argument);

     // Virtual chain ID has incorrect MSB.
    uint8_t rawPublicKey8[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId8[] = "\x07\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey8, rawPublicKey8 + sizeof(rawPublicKey8) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId8, rawVirtualChainId8 + sizeof(rawVirtualChainId8) - 1);

    EXPECT_THROW(Address a8(publicKey, virtualChainId, Address::MAIN_NETWORK_ID), invalid_argument);

    // Network ID is incorrect.
    uint8_t rawPublicKey9[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    uint8_t rawVirtualChainId9[] = "\x64\x0e\xd3";
    publicKey = vector<uint8_t>(rawPublicKey9, rawPublicKey9 + sizeof(rawPublicKey9) - 1);
    virtualChainId = vector<uint8_t>(rawVirtualChainId9, rawVirtualChainId9 + sizeof(rawVirtualChainId9) - 1);

    EXPECT_THROW(Address a9(publicKey, virtualChainId, 99), invalid_argument);
}

TEST(Address, verifies_account_public_address) {
    string address;

    // Empty.
    EXPECT_FALSE(Address::IsValid(""));

    // Too short.
    EXPECT_FALSE(Address::IsValid("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu"));
    EXPECT_FALSE(Address::IsValid("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFs"));

    // Too long.
    EXPECT_FALSE(Address::IsValid("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu1a"));
    EXPECT_FALSE(Address::IsValid("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu1aa"));

    // Invalid BASE58.
    EXPECT_FALSE(Address::IsValid("M1EXMPnnaWFqOyVxWdhYCgGzpnaL4qBy4QFsJu1"));
    EXPECT_FALSE(Address::IsValid("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4IFsJu1"));
    EXPECT_FALSE(Address::IsValid("M1EXMPnnaWFq0yVxWdhYCgGzpnaL4qBy4QFsJu1"));
    EXPECT_FALSE(Address::IsValid("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJul"));
    EXPECT_FALSE(Address::IsValid("M1EXMPnna+FqRyVxWdhYCgGzpnaL4qBy4QFsJu1"));
    EXPECT_FALSE(Address::IsValid("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QF/Ju1"));

    // Incorrect virtual chain ID.
    EXPECT_FALSE(Address::IsValid("M1xKxXz7LPuyXmhxpoaNkr96jKrT99FsFKcBEx"));
    EXPECT_FALSE(Address::IsValid("M1H8exm1WU6CTGcpFiupsL7g1zN9dYoxKLjmdP"));

    // Incorrect network ID.
    EXPECT_FALSE(Address::IsValid("MbEXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4PYcq9J"));
    EXPECT_FALSE(Address::IsValid("MtEXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4STwXbx"));

    // Incorrect version.
    EXPECT_FALSE(Address::IsValid("M6EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4RH1CrX"));
    EXPECT_FALSE(Address::IsValid("MNEXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4U4Spwi"));

    // Incorrect checksum.
    EXPECT_FALSE(Address::IsValid("M1LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMnxhySx"));
    EXPECT_FALSE(Address::IsValid("M1LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMjMfiiL"));

    // Correct addresses.
    EXPECT_TRUE(Address::IsValid("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu1"));
    EXPECT_TRUE(Address::IsValid("T1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4NjCK6C"));
    EXPECT_TRUE(Address::IsValid("M1LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMoNRmxU"));
    EXPECT_TRUE(Address::IsValid("T1LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMpsdEej"));
}
