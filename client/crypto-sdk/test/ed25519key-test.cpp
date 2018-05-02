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
    EXPECT_TRUE(key1.HasPrivateKey());

    ED25519Key key2;
    const string publicKey2(Utils::Vec2Hex(key2.GetPublicKey()));
    EXPECT_EQ(publicKey2.length(), ED25519Key::PUBLIC_KEY_SIZE * 2);
    EXPECT_TRUE(key2.HasPrivateKey());

    EXPECT_STRNE(publicKey1.c_str(), publicKey2.c_str());
}

TEST(ED25519Key, imports_ed25519_public_key) {
    uint8_t rawPublicKey1[] = "\x8d\x41\xd0\x55\xd0\x04\x59\xbe\x37\xf7\x49\xda\x2c\xaf\x87\xbd\x4c\xed\x6f\xaf\xa3\x35\xb1\xf2\x14\x2e\x0f\x44\x50\x1b\x2c\x65";
    vector<uint8_t> publicKey1(rawPublicKey1, rawPublicKey1 + sizeof(rawPublicKey1) - 1);
    ED25519Key key1(publicKey1);

    EXPECT_THAT(publicKey1, ElementsAreArray(key1.GetPublicKey()));
    EXPECT_FALSE(key1.HasPrivateKey());

    uint8_t rawPublicKey2[] = "\x7a\x46\x34\x87\xbb\x0e\xb5\x84\xda\xbc\xcd\x52\x39\x85\x06\xb4\xa2\xdd\x43\x25\x03\xcc\x6b\x7b\x58\x2f\x87\x83\x2a\xd1\x04\xe6";
    vector<uint8_t> publicKey2(rawPublicKey2, rawPublicKey2 + sizeof(rawPublicKey2) - 1);
    ED25519Key key2(publicKey2);
    EXPECT_FALSE(key2.HasPrivateKey());

    EXPECT_THAT(publicKey2, ElementsAreArray(key2.GetPublicKey()));
}

TEST(ED25519Key, imports_ed25519_public_key_as_string) {
    const string publicKey1("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65");
    ED25519Key key1(publicKey1);

    EXPECT_THAT(Utils::Hex2Vec(publicKey1), ElementsAreArray(key1.GetPublicKey()));
    EXPECT_FALSE(key1.HasPrivateKey());

    const string publicKey2("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6");
    ED25519Key key2(publicKey2);

    EXPECT_THAT(Utils::Hex2Vec(publicKey2), ElementsAreArray(key2.GetPublicKey()));
    EXPECT_FALSE(key2.HasPrivateKey());
}

TEST(ED25519Key, throws_on_invalid_arguments_imports_ed25519_public_key) {
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

TEST(ED25519Key, imports_ed25519_public_and_private_keys) {
    uint8_t rawPublicKey1[] = "\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> publicKey1(rawPublicKey1, rawPublicKey1 + sizeof(rawPublicKey1) - 1);
    uint8_t rawPrivateKey1[] = "\x6c\x52\x99\xdd\x6f\xd8\x0e\x61\x6a\x2b\x70\x64\x15\xc9\xf8\xa8\x0c\x20\x94\xa8\x04\xd3\x33\x8a\x5e\x92\x8a\xe1\x02\xdd\x45\xed\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> privateKey1(rawPrivateKey1, rawPrivateKey1 + sizeof(rawPrivateKey1) - 1);
    ED25519Key key1(publicKey1, privateKey1);

    EXPECT_THAT(publicKey1, ElementsAreArray(key1.GetPublicKey()));
    EXPECT_TRUE(key1.HasPrivateKey());

    uint8_t rawPublicKey2[] = "\x8f\xab\xb6\x5b\xeb\xa8\xc9\xe8\x3e\x00\xce\xce\x26\xa2\x0d\xcc\x34\x71\x6c\x88\x9f\xa7\x94\x54\xca\x94\x18\x79\xd3\xec\x71\xc4";
    vector<uint8_t> publicKey2(rawPublicKey2, rawPublicKey2 + sizeof(rawPublicKey2) - 1);
    uint8_t rawPrivateKey2[] = "\x85\xb9\xaa\x7e\x52\x78\x79\x1e\x06\xd1\x76\x5b\x33\x3f\x2a\xc2\x0f\x5e\x41\x3c\x65\xc5\x67\xc7\x61\x1b\x1b\x85\x1e\xa9\xcb\x46\x8f\xab\xb6\x5b\xeb\xa8\xc9\xe8\x3e\x00\xce\xce\x26\xa2\x0d\xcc\x34\x71\x6c\x88\x9f\xa7\x94\x54\xca\x94\x18\x79\xd3\xec\x71\xc4";
    vector<uint8_t> privateKey2(rawPrivateKey2, rawPrivateKey2 + sizeof(rawPrivateKey2) - 1);
    ED25519Key key2(publicKey2, privateKey2);

    EXPECT_THAT(publicKey2, ElementsAreArray(key2.GetPublicKey()));
    EXPECT_TRUE(key2.HasPrivateKey());
}

TEST(ED25519Key, imports_ed25519_public_and_private_keys_as_strings) {
    const string publicKey1("d96ec62bba00022375813a4acf4771a719761cb86edf9a1873f11e00dea00e61");
    const string privateKey1("6c5299dd6fd80e616a2b706415c9f8a80c2094a804d3338a5e928ae102dd45edd96ec62bba00022375813a4acf4771a719761cb86edf9a1873f11e00dea00e61");
    ED25519Key key1(publicKey1, privateKey1);

    EXPECT_THAT(Utils::Hex2Vec(publicKey1), ElementsAreArray(key1.GetPublicKey()));
    EXPECT_TRUE(key1.HasPrivateKey());

    const string publicKey2("8fabb65beba8c9e83e00cece26a20dcc34716c889fa79454ca941879d3ec71c4");
    const string privateKey2("85b9aa7e5278791e06d1765b333f2ac20f5e413c65c567c7611b1b851ea9cb468fabb65beba8c9e83e00cece26a20dcc34716c889fa79454ca941879d3ec71c4");
    ED25519Key key2(publicKey2, privateKey2);

    EXPECT_THAT(Utils::Hex2Vec(publicKey2), ElementsAreArray(key2.GetPublicKey()));
    EXPECT_TRUE(key2.HasPrivateKey());
}

TEST(ED25519Key, throws_on_invalid_arguments_imports_ed25519_public_and_private_keys) {
    // Empty public key.
    uint8_t rawPublicKey1[] = "";
    vector<uint8_t> publicKey1(rawPublicKey1, rawPublicKey1 + sizeof(rawPublicKey1) - 1);
    uint8_t rawPrivateKey1[] = "\x6c\x52\x99\xdd\x6f\xd8\x0e\x61\x6a\x2b\x70\x64\x15\xc9\xf8\xa8\x0c\x20\x94\xa8\x04\xd3\x33\x8a\x5e\x92\x8a\xe1\x02\xdd\x45\xed\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> privateKey1(rawPrivateKey1, rawPrivateKey1 + sizeof(rawPrivateKey1) - 1);

    EXPECT_THROW(ED25519Key key1(publicKey1, privateKey1), invalid_argument);

    // Empty private key.
    uint8_t rawPublicKey2[] = "\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> publicKey2(rawPublicKey2, rawPublicKey2 + sizeof(rawPublicKey2) - 1);
    uint8_t rawPrivateKey2[] = "\x6c\x52\x99\xdd\x6f\xd8\x0e\x61\x6a\x2b\x70\x64\x15\xc9\xf8\xa8\x0c\x20\x94\xa8\x04\xd3\x33\x8a\x5e\x92\x8a\xe1\x02\xdd\x45\xed\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> privateKey2(rawPrivateKey2, rawPrivateKey2 + sizeof(rawPrivateKey2) - 1);

    EXPECT_THROW(ED25519Key key2(publicKey2, privateKey2), invalid_argument);

    // Public key is too short.
    uint8_t rawPublicKey3[] = "\x2a\x33\xff";
    vector<uint8_t> publicKey3(rawPublicKey3, rawPublicKey3 + sizeof(rawPublicKey3) - 1);
    uint8_t rawPrivateKey3[] = "\x6c\x52\x99\xdd\x6f\xd8\x0e\x61\x6a\x2b\x70\x64\x15\xc9\xf8\xa8\x0c\x20\x94\xa8\x04\xd3\x33\x8a\x5e\x92\x8a\xe1\x02\xdd\x45\xed\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> privateKey3(rawPrivateKey3, rawPrivateKey3 + sizeof(rawPrivateKey3) - 1);

    EXPECT_THROW(ED25519Key key3(publicKey3, privateKey3), invalid_argument);

    // Private key is too short.
    uint8_t rawPublicKey4[] = "\x8f\xab\xb6\x5b\xeb\xa8\xc9\xe8\x3e\x00\xce\xce\x26\xa2\x0d\xcc\x34\x71\x6c\x88\x9f\xa7\x94\x54\xca\x94\x18\x79\xd3\xec\x71\xc4";
    vector<uint8_t> publicKey4(rawPublicKey4, rawPublicKey4 + sizeof(rawPublicKey4) - 1);
    uint8_t rawPrivateKey4[] = "\x6c\x52\x99\xdd\x6f\xd8\x0e\x61\x6a\x2b\x70\x64\x15\xc9\xf8\xa8\x0c\x20\x94\xa8\x04\xd3\x33\x8a\x5e\x92\x8a\xe1\x02\xdd\x45\xed\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e";
    vector<uint8_t> privateKey4(rawPrivateKey4, rawPrivateKey4 + sizeof(rawPrivateKey4) - 1);

    EXPECT_THROW(ED25519Key key4(publicKey4, privateKey4), invalid_argument);

    // Public key is too long.
    uint8_t rawPublicKey5[] = "\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61\xaa";
    vector<uint8_t> publicKey5(rawPublicKey5, rawPublicKey5 + sizeof(rawPublicKey5) - 1);
    uint8_t rawPrivateKey5[] = "\x6c\x52\x99\xdd\x6f\xd8\x0e\x61\x6a\x2b\x70\x64\x15\xc9\xf8\xa8\x0c\x20\x94\xa8\x04\xd3\x33\x8a\x5e\x92\x8a\xe1\x02\xdd\x45\xed\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> privateKey5(rawPrivateKey5, rawPrivateKey5 + sizeof(rawPrivateKey5) - 1);

    EXPECT_THROW(ED25519Key key5(publicKey5, privateKey5), invalid_argument);

    // Private key is too long.
    uint8_t rawPublicKey6[] = "\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> publicKey6(rawPublicKey6, rawPublicKey6 + sizeof(rawPublicKey6) - 1);
    uint8_t rawPrivateKey6[] = "\x6c\x52\x99\xdd\x6f\xd8\x0e\x61\x6a\x2b\x70\x64\x15\xc9\xf8\xa8\x0c\x20\x94\xa8\x04\xd3\x33\x8a\x5e\x92\x8a\xe1\x02\xdd\x45\xed\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61\x12";
    vector<uint8_t> privateKey6(rawPrivateKey6, rawPrivateKey6 + sizeof(rawPrivateKey6) - 1);

    EXPECT_THROW(ED25519Key key6(publicKey6, privateKey6), invalid_argument);

    // Unrelated keys #1.
    uint8_t rawPublicKey7[] = "\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> publicKey7(rawPublicKey7, rawPublicKey7 + sizeof(rawPublicKey7) - 1);
    uint8_t rawPrivateKey7[] = "\x85\xb9\xaa\x7e\x52\x78\x79\x1e\x06\xd1\x76\x5b\x33\x3f\x2a\xc2\x0f\x5e\x41\x3c\x65\xc5\x67\xc7\x61\x1b\x1b\x85\x1e\xa9\xcb\x46\x8f\xab\xb6\x5b\xeb\xa8\xc9\xe8\x3e\x00\xce\xce\x26\xa2\x0d\xcc\x34\x71\x6c\x88\x9f\xa7\x94\x54\xca\x94\x18\x79\xd3\xec\x71\xc4";
    vector<uint8_t> privateKey7(rawPrivateKey7, rawPrivateKey7 + sizeof(rawPrivateKey7) - 1);

    EXPECT_THROW(ED25519Key key7(publicKey7, privateKey7), invalid_argument);

    // Unrelated keys #2.
    uint8_t rawPublicKey8[] = "\x8f\xab\xb6\x5b\xeb\xa8\xc9\xe8\x3e\x00\xce\xce\x26\xa2\x0d\xcc\x34\x71\x6c\x88\x9f\xa7\x94\x54\xca\x94\x18\x79\xd3\xec\x71\xc4";
    vector<uint8_t> publicKey8(rawPublicKey8, rawPublicKey8 + sizeof(rawPublicKey8) - 1);
    uint8_t rawPrivateKey8[] = "\x6c\x52\x99\xdd\x6f\xd8\x0e\x61\x6a\x2b\x70\x64\x15\xc9\xf8\xa8\x0c\x20\x94\xa8\x04\xd3\x33\x8a\x5e\x92\x8a\xe1\x02\xdd\x45\xed\xd9\x6e\xc6\x2b\xba\x00\x02\x23\x75\x81\x3a\x4a\xcf\x47\x71\xa7\x19\x76\x1c\xb8\x6e\xdf\x9a\x18\x73\xf1\x1e\x00\xde\xa0\x0e\x61";
    vector<uint8_t> privateKey8(rawPrivateKey8, rawPrivateKey8 + sizeof(rawPrivateKey8) - 1);

    EXPECT_THROW(ED25519Key key8(publicKey8, privateKey8), invalid_argument);
}
