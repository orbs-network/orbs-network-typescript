#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/crypto.h"
#include "../lib/address.h"
#include "../lib/ed25519key.h"
#include "../lib/utils.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(Address, creates_from_binary_arguments) {
    vector<uint8_t> publicKey1(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId1(Utils::Hex2Vec("640ed3"));
    Address a1(publicKey1, virtualChainId1, Address::MAIN_NETWORK_ID);

    EXPECT_EQ(a1.GetVersion(), 0);
    EXPECT_EQ(a1.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a1.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("640ed3")));
    EXPECT_THAT(a1.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("c13052d8208230a58ab363708c08e78f1125f488")));
    EXPECT_THAT(a1.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("0b4af4d2")));

    vector<uint8_t> publicKey2(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId2(Utils::Hex2Vec("640ed3"));
    Address a2(publicKey2, virtualChainId2, Address::TEST_NETWORK_ID);

    EXPECT_EQ(a2.GetVersion(), 0);
    EXPECT_EQ(a2.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a2.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("640ed3")));
    EXPECT_THAT(a2.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("c13052d8208230a58ab363708c08e78f1125f488")));
    EXPECT_THAT(a2.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("daddd005")));

    vector<uint8_t> publicKey3(Utils::Hex2Vec("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6"));
    vector<uint8_t> virtualChainId3(Utils::Hex2Vec("9012ca"));
    Address a3(publicKey3, virtualChainId3, Address::MAIN_NETWORK_ID);

    EXPECT_EQ(a3.GetVersion(), 0);
    EXPECT_EQ(a3.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a3.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("9012ca")));
    EXPECT_THAT(a3.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("44068acc1b9ffc072694b684fc11ff229aff0b28")));
    EXPECT_THAT(a3.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("f41bb73f")));

    vector<uint8_t> publicKey4(Utils::Hex2Vec("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6"));
    vector<uint8_t> virtualChainId4(Utils::Hex2Vec("9012ca"));
    Address a4(publicKey4, virtualChainId4, Address::TEST_NETWORK_ID);

    EXPECT_EQ(a4.GetVersion(), 0);
    EXPECT_EQ(a4.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a4.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("9012ca")));
    EXPECT_THAT(a4.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("44068acc1b9ffc072694b684fc11ff229aff0b28")));
    EXPECT_THAT(a4.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("258c93e8")));
}

TEST(Address, creates_from_ed25519_key) {
    vector<uint8_t> publicKey1(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId1(Utils::Hex2Vec("640ed3"));
    ED25519Key key1(publicKey1);
    Address a1(key1, virtualChainId1, Address::MAIN_NETWORK_ID);

    EXPECT_EQ(a1.GetVersion(), 0);
    EXPECT_EQ(a1.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a1.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("640ed3")));
    EXPECT_THAT(a1.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("c13052d8208230a58ab363708c08e78f1125f488")));
    EXPECT_THAT(a1.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("0b4af4d2")));

    vector<uint8_t> publicKey2(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId2(Utils::Hex2Vec("640ed3"));
    ED25519Key key2(publicKey2);
    Address a2(key2, virtualChainId2, Address::TEST_NETWORK_ID);

    EXPECT_EQ(a2.GetVersion(), 0);
    EXPECT_EQ(a2.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a2.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("640ed3")));
    EXPECT_THAT(a2.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("c13052d8208230a58ab363708c08e78f1125f488")));
    EXPECT_THAT(a2.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("daddd005")));

    vector<uint8_t> publicKey3(Utils::Hex2Vec("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6"));
    vector<uint8_t> virtualChainId3(Utils::Hex2Vec("9012ca"));
    ED25519Key key3(publicKey3);
    Address a3(key3, virtualChainId3, Address::MAIN_NETWORK_ID);

    EXPECT_EQ(a3.GetVersion(), 0);
    EXPECT_EQ(a3.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a3.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("9012ca")));
    EXPECT_THAT(a3.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("44068acc1b9ffc072694b684fc11ff229aff0b28")));
    EXPECT_THAT(a3.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("f41bb73f")));

    vector<uint8_t> publicKey4(Utils::Hex2Vec("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6"));
    vector<uint8_t> virtualChainId4(Utils::Hex2Vec("9012ca"));
    ED25519Key key4(publicKey4);
    Address a4(key4, virtualChainId4, Address::TEST_NETWORK_ID);

    EXPECT_EQ(a4.GetVersion(), 0);
    EXPECT_EQ(a4.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a4.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("9012ca")));
    EXPECT_THAT(a4.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("44068acc1b9ffc072694b684fc11ff229aff0b28")));
    EXPECT_THAT(a4.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("258c93e8")));
}

TEST(Address, creates_from_string_public_key) {
    Address a1("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65", "640ed3", "M");

    EXPECT_EQ(a1.GetVersion(), 0);
    EXPECT_EQ(a1.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a1.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("640ed3")));
    EXPECT_THAT(a1.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("c13052d8208230a58ab363708c08e78f1125f488")));
    EXPECT_THAT(a1.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("0b4af4d2")));

    Address a2("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65", "640ed3", "T");

    EXPECT_EQ(a2.GetVersion(), 0);
    EXPECT_EQ(a2.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a2.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("640ed3")));
    EXPECT_THAT(a2.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("c13052d8208230a58ab363708c08e78f1125f488")));
    EXPECT_THAT(a2.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("daddd005")));

    Address a3("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6", "9012ca", "M");

    EXPECT_EQ(a3.GetVersion(), 0);
    EXPECT_EQ(a3.GetNetworkId(), Address::MAIN_NETWORK_ID);
    EXPECT_THAT(a3.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("9012ca")));
    EXPECT_THAT(a3.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("44068acc1b9ffc072694b684fc11ff229aff0b28")));
    EXPECT_THAT(a3.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("f41bb73f")));

    Address a4("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6", "9012ca", "T");

    EXPECT_EQ(a4.GetVersion(), 0);
    EXPECT_EQ(a4.GetNetworkId(), Address::TEST_NETWORK_ID);
    EXPECT_THAT(a4.GetVirtualChainId(), ElementsAreArray(Utils::Hex2Vec("9012ca")));
    EXPECT_THAT(a4.GetAccountId(), ElementsAreArray(Utils::Hex2Vec("44068acc1b9ffc072694b684fc11ff229aff0b28")));
    EXPECT_THAT(a4.GetChecksum(), ElementsAreArray(Utils::Hex2Vec("258c93e8")));
}

TEST(Address, converts_to_string) {
    string publicAddress;

    vector<uint8_t> publicKey1(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId1(Utils::Hex2Vec("640ed3"));
    Address a1(publicKey1, virtualChainId1, Address::MAIN_NETWORK_ID);

    EXPECT_STREQ(a1.ToString().c_str(), "M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qqa1");

    vector<uint8_t> publicKey2(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId2(Utils::Hex2Vec("640ed3"));
    Address a2(publicKey2, virtualChainId2, Address::TEST_NETWORK_ID);

    EXPECT_STREQ(a2.ToString().c_str(), "T00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4TM9btp");

    vector<uint8_t> publicKey3(Utils::Hex2Vec("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6"));
    vector<uint8_t> virtualChainId3(Utils::Hex2Vec("9012ca"));
    Address a3(publicKey3, virtualChainId3, Address::MAIN_NETWORK_ID);

    EXPECT_STREQ(a3.ToString().c_str(), "M00LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMqZ9vza");

    vector<uint8_t> publicKey4(Utils::Hex2Vec("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6"));
    vector<uint8_t> virtualChainId4(Utils::Hex2Vec("9012ca"));
    Address a4(publicKey4, virtualChainId4, Address::TEST_NETWORK_ID);

    EXPECT_STREQ(a4.ToString().c_str(), "T00LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMkGvQPR");
}

TEST(Address, throws_on_invalid_arguments_on_creation) {
    const vector<uint8_t> empty;

    // Empty public key.
    vector<uint8_t> virtualChainId1(Utils::Hex2Vec("640ed3"));
    EXPECT_THROW(Address a1(empty, virtualChainId1, Address::MAIN_NETWORK_ID), invalid_argument);

    // Public key is too short.
    vector<uint8_t> publicKey2(Utils::Hex2Vec("1233"));
    vector<uint8_t> virtualChainId2(Utils::Hex2Vec("640ed3"));
    EXPECT_THROW(Address a2(publicKey2, virtualChainId2, Address::MAIN_NETWORK_ID), invalid_argument);

    // Public key is longer by one character.
    vector<uint8_t> publicKey3(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65aa"));
    vector<uint8_t> virtualChainId3(Utils::Hex2Vec("640ed3"));
    EXPECT_THROW(Address a3(publicKey3, virtualChainId3, Address::MAIN_NETWORK_ID), invalid_argument);

    // Public key is shorter by one character.
    vector<uint8_t> publicKey4(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c"));
    vector<uint8_t> virtualChainId4(Utils::Hex2Vec("640ed3"));
    EXPECT_THROW(Address a4(publicKey4, virtualChainId4, Address::MAIN_NETWORK_ID), invalid_argument);

    // Virtual chain ID is empty.
    vector<uint8_t> publicKey5(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    EXPECT_THROW(Address a5(publicKey5, empty, Address::MAIN_NETWORK_ID), invalid_argument);

    // Virtual chain ID is too short.
    vector<uint8_t> publicKey6(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId6(Utils::Hex2Vec("640e"));
    EXPECT_THROW(Address a6(publicKey6, virtualChainId6, Address::MAIN_NETWORK_ID), invalid_argument);

    // Virtual chain ID is too long.
    vector<uint8_t> publicKey7(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId7(Utils::Hex2Vec("640ed348"));
    EXPECT_THROW(Address a7(publicKey7, virtualChainId7, Address::MAIN_NETWORK_ID), invalid_argument);

    // Virtual chain ID has incorrect MSB.
    vector<uint8_t> publicKey8(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId8(Utils::Hex2Vec("070ed3"));
    EXPECT_THROW(Address a8(publicKey8, virtualChainId8, Address::MAIN_NETWORK_ID), invalid_argument);

    // Network ID is incorrect.
    vector<uint8_t> publicKey9(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    vector<uint8_t> virtualChainId9(Utils::Hex2Vec("640ed3"));
    EXPECT_THROW(Address a9(publicKey9, virtualChainId9, 99), invalid_argument);
}

TEST(Address, verifies_account_public_address) {
    string address;

    // Empty.
    EXPECT_FALSE(Address::IsValid(""));

    // Too short.
    EXPECT_FALSE(Address::IsValid("M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qqa"));
    EXPECT_FALSE(Address::IsValid("M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qq"));

    // Too long.
    EXPECT_FALSE(Address::IsValid("M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qqa1a"));
    EXPECT_FALSE(Address::IsValid("M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qqa1aa"));

    // Invalid BASE58.
    EXPECT_FALSE(Address::IsValid("M00EXMPnnaWFqOyVxWdhYCgGzpnaL4qBy4N3Qqa1"));
    EXPECT_FALSE(Address::IsValid("M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4I3Qqa1"));
    EXPECT_FALSE(Address::IsValid("M00EXMPnnaWFq0yVxWdhYCgGzpnaL4qBy4N3Qqa1"));
    EXPECT_FALSE(Address::IsValid("M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qqal"));
    EXPECT_FALSE(Address::IsValid("M00EXMPnna+FqRyVxWdhYCgGzpnaL4qBy4N3Qqa1"));
    EXPECT_FALSE(Address::IsValid("M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3/qa1"));

    // Incorrect virtual chain ID.
    EXPECT_FALSE(Address::IsValid("M00xKxXz7LPuyXmhxpoaNkr96jKrT99FsJ3AXQr"));
    EXPECT_FALSE(Address::IsValid("M00H8exm1WU6CTGcpFiupsL7g1zN9dYoxMZ8ZrF"));

    // Incorrect network ID.
    EXPECT_FALSE(Address::IsValid("\"00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4TXq9Zh"));
    EXPECT_FALSE(Address::IsValid("300EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4NZTSK1"));

    // Incorrect version.
    EXPECT_FALSE(Address::IsValid("M05EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4TZpGvu"));
    EXPECT_FALSE(Address::IsValid("M0FEXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4RjxghL"));

    // Incorrect checksum.
    EXPECT_FALSE(Address::IsValid("M00LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMnxhySx"));
    EXPECT_FALSE(Address::IsValid("M00LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMjMfiiL"));

    // Correct addresses.
    EXPECT_TRUE(Address::IsValid("M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qqa1"));
    EXPECT_TRUE(Address::IsValid("T00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4TM9btp"));
    EXPECT_TRUE(Address::IsValid("M00LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMqZ9vza"));
    EXPECT_TRUE(Address::IsValid("T00LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMkGvQPR"));
}
