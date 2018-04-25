#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/crypto.h"
#include "../lib/ed25519key.h"
#include "../lib/utils.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(ED25519Key, generates_ed25519_key) {
    ED25519Key key1;
    const string publicKey1(Utils::Vec2Hex(key1.GetPublicKey()));
    EXPECT_EQ(publicKey1.length(), ED25519Key::PUBLIC_KEY_SIZE * 2);

    ED25519Key key2;
    const string publicKey2(Utils::Vec2Hex(key2.GetPublicKey()));
    EXPECT_EQ(publicKey2.length(), ED25519Key::PUBLIC_KEY_SIZE * 2);

    EXPECT_STRNE(publicKey1.c_str(), publicKey2.c_str());
}

TEST(ED25519Key, imports_ed25519_pulic_key) {
    uint8_t rawPublicKey1[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    vector<uint8_t> publicKey1(rawPublicKey1, rawPublicKey1 + sizeof(rawPublicKey1) - 1);
    ED25519Key key1(publicKey1);

    EXPECT_THAT(publicKey1, ElementsAreArray(key1.GetPublicKey()));

    uint8_t rawPublicKey2[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    vector<uint8_t> publicKey2(rawPublicKey2, rawPublicKey2 + sizeof(rawPublicKey2) - 1);
    ED25519Key key2(publicKey2);

    EXPECT_THAT(publicKey2, ElementsAreArray(key2.GetPublicKey()));
}

TEST(ED25519Key, imports_ed25519_pulic_key_as_string) {
    const string publicKey1("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65");
    ED25519Key key1(publicKey1);

    EXPECT_THAT(Utils::Hex2Vec(publicKey1), ElementsAreArray(key1.GetPublicKey()));

    const string publicKey2("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6");
    ED25519Key key2(publicKey2);

    EXPECT_THAT(Utils::Hex2Vec(publicKey2), ElementsAreArray(key2.GetPublicKey()));
}

TEST(ED25519Key, throws_on_invalid_arguments_imports_ed25519_pulic_key) {
    vector<uint8_t> publicKey;

    // Empty.
    uint8_t rawPublicKey1[] = "";
    vector<uint8_t> publicKey1(rawPublicKey1, rawPublicKey1 + sizeof(rawPublicKey1) - 1);

    EXPECT_THROW(ED25519Key key1(publicKey1), invalid_argument);

    // Too short.
    uint8_t rawPublicKey2[] = "\x2a\x33\xff";
    vector<uint8_t> publicKey2(rawPublicKey2, rawPublicKey2 + sizeof(rawPublicKey2) - 1);

    EXPECT_THROW(ED25519Key key2(publicKey2), invalid_argument);

    // Too long.
    uint8_t rawPublicKey3[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65\x12";
    vector<uint8_t> publicKey3(rawPublicKey3, rawPublicKey3 + sizeof(rawPublicKey3) - 1);

    EXPECT_THROW(ED25519Key key3(publicKey3), invalid_argument);
}
