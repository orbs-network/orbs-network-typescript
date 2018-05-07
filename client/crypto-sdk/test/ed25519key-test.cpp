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
    const string privateKey1(Utils::Vec2Hex(key1.GetPrivateKeyUnsafe()));
    EXPECT_EQ(publicKey1.length(), ED25519Key::PUBLIC_KEY_SIZE * 2);
    EXPECT_EQ(privateKey1.length(), ED25519Key::PRIVATE_KEY_SIZE * 2);
    EXPECT_TRUE(key1.HasPrivateKey());

    ED25519Key key2;
    const string publicKey2(Utils::Vec2Hex(key2.GetPublicKey()));
    const string privateKey2(Utils::Vec2Hex(key2.GetPrivateKeyUnsafe()));
    EXPECT_EQ(publicKey2.length(), ED25519Key::PUBLIC_KEY_SIZE * 2);
    EXPECT_EQ(privateKey1.length(), ED25519Key::PRIVATE_KEY_SIZE * 2);
    EXPECT_TRUE(key2.HasPrivateKey());

    EXPECT_STRNE(publicKey1.c_str(), publicKey2.c_str());
}

TEST(ED25519Key, generates_ed25519_key_multiple_times) {
    for (int i = 0; i < 100; ++i) {
        ED25519Key key;
        const string publicKey(Utils::Vec2Hex(key.GetPublicKey()));
        const string privateKey(Utils::Vec2Hex(key.GetPrivateKeyUnsafe()));
        EXPECT_EQ(publicKey.length(), ED25519Key::PUBLIC_KEY_SIZE * 2);
        EXPECT_EQ(privateKey.length(), ED25519Key::PRIVATE_KEY_SIZE * 2);
        EXPECT_TRUE(key.HasPrivateKey());
    }
}

TEST(ED25519Key, imports_ed25519_public_key) {
    vector<uint8_t> publicKey1(Utils::Hex2Vec("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"));
    ED25519Key key1(publicKey1);

    EXPECT_THAT(publicKey1, ElementsAreArray(key1.GetPublicKey()));
    EXPECT_THROW(key1.GetPrivateKeyUnsafe(), logic_error);
    EXPECT_FALSE(key1.HasPrivateKey());

    vector<uint8_t> publicKey2(Utils::Hex2Vec("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6"));
    ED25519Key key2(publicKey2);
    EXPECT_THROW(key2.GetPrivateKeyUnsafe(), logic_error);
    EXPECT_FALSE(key2.HasPrivateKey());

    EXPECT_THAT(publicKey2, ElementsAreArray(key2.GetPublicKey()));
}

TEST(ED25519Key, imports_ed25519_public_key_as_string) {
    const string publicKey1("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65");
    ED25519Key key1(publicKey1);

    EXPECT_THAT(Utils::Hex2Vec(publicKey1), ElementsAreArray(key1.GetPublicKey()));
    EXPECT_THROW(key1.GetPrivateKeyUnsafe(), logic_error);
    EXPECT_FALSE(key1.HasPrivateKey());

    const string publicKey2("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6");
    ED25519Key key2(publicKey2);

    EXPECT_THAT(Utils::Hex2Vec(publicKey2), ElementsAreArray(key2.GetPublicKey()));
    EXPECT_THROW(key2.GetPrivateKeyUnsafe(), logic_error);
    EXPECT_FALSE(key2.HasPrivateKey());
}

TEST(ED25519Key, throws_on_invalid_arguments_imports_ed25519_public_key) {
    const vector<uint8_t> empty;

    // Empty.
    EXPECT_THROW(ED25519Key key1(empty), invalid_argument);

    // Too short.
    vector<uint8_t> publicKey2(Utils::Hex2Vec("2a33ff"));
    EXPECT_THROW(ED25519Key key2(publicKey2), invalid_argument);

    // Too long.
    const string publicKey3("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6aa");
    EXPECT_THROW(ED25519Key key3(publicKey3), invalid_argument);
}

TEST(ED25519Key, imports_ed25519_public_and_private_keys) {
    vector<uint8_t> publicKey1(Utils::Hex2Vec("b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"));
    vector<uint8_t> privateKey1(Utils::Hex2Vec("3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"));
    ED25519Key key1(publicKey1, privateKey1);

    EXPECT_THAT(publicKey1, ElementsAreArray(key1.GetPublicKey()));
    EXPECT_THAT(privateKey1, ElementsAreArray(key1.GetPrivateKeyUnsafe()));
    EXPECT_TRUE(key1.HasPrivateKey());

    vector<uint8_t> publicKey2(Utils::Hex2Vec("f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3"));
    vector<uint8_t> privateKey2(Utils::Hex2Vec("031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935"));
    ED25519Key key2(publicKey2, privateKey2);

    EXPECT_THAT(publicKey2, ElementsAreArray(key2.GetPublicKey()));
    EXPECT_THAT(privateKey2, ElementsAreArray(key2.GetPrivateKeyUnsafe()));
    EXPECT_TRUE(key2.HasPrivateKey());
}

TEST(ED25519Key, imports_ed25519_public_and_private_keys_as_strings) {
    const string publicKey1("b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b");
    const string privateKey1("3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7");
    ED25519Key key1(publicKey1, privateKey1);

    EXPECT_THAT(Utils::Hex2Vec(publicKey1), ElementsAreArray(key1.GetPublicKey()));
    EXPECT_THAT(Utils::Hex2Vec(privateKey1), ElementsAreArray(key1.GetPrivateKeyUnsafe()));
    EXPECT_TRUE(key1.HasPrivateKey());

    const string publicKey2("f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3");
    const string privateKey2("031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935");
    ED25519Key key2(publicKey2, privateKey2);

    EXPECT_THAT(Utils::Hex2Vec(publicKey2), ElementsAreArray(key2.GetPublicKey()));
    EXPECT_THAT(Utils::Hex2Vec(privateKey2), ElementsAreArray(key2.GetPrivateKeyUnsafe()));
    EXPECT_TRUE(key2.HasPrivateKey());
}

TEST(ED25519Key, throws_on_invalid_arguments_imports_ed25519_public_and_private_keys) {
    const vector<uint8_t> empty;

    // Empty public key.
    vector<uint8_t> privateKey1(Utils::Hex2Vec("3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"));
    EXPECT_THROW(ED25519Key key1(empty, privateKey1), invalid_argument);

    // Empty private key.
    vector<uint8_t> publicKey2(Utils::Hex2Vec("b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"));
    EXPECT_THROW(ED25519Key key2(publicKey2, empty), invalid_argument);

    // Public key is too short.
    vector<uint8_t> publicKey3(Utils::Hex2Vec("2a33ff"));
    vector<uint8_t> privateKey3(Utils::Hex2Vec("3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"));
    EXPECT_THROW(ED25519Key key3(publicKey3, privateKey3), invalid_argument);

    // Private key is too short.
    vector<uint8_t> publicKey4(Utils::Hex2Vec("f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3"));
    vector<uint8_t> privateKey4(Utils::Hex2Vec("031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b9"));
    EXPECT_THROW(ED25519Key key4(publicKey4, privateKey4), invalid_argument);

    // Public key is too long.
    vector<uint8_t> publicKey5(Utils::Hex2Vec("f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3aa"));
    vector<uint8_t> privateKey5(Utils::Hex2Vec("3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"));
    EXPECT_THROW(ED25519Key key5(publicKey5, privateKey5), invalid_argument);

    // Private key is too long.
    vector<uint8_t> publicKey6(Utils::Hex2Vec("b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"));
    vector<uint8_t> privateKey6(Utils::Hex2Vec("3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7aa"));
    EXPECT_THROW(ED25519Key key6(publicKey6, privateKey6), invalid_argument);

    // Unrelated keys #1.
    vector<uint8_t> publicKey7(Utils::Hex2Vec("b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"));
    vector<uint8_t> privateKey7(Utils::Hex2Vec("031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935"));
    EXPECT_THROW(ED25519Key key7(publicKey7, privateKey7), invalid_argument);

    // Unrelated keys #2.
    vector<uint8_t> publicKey8(Utils::Hex2Vec("f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3"));
    vector<uint8_t> privateKey8(Utils::Hex2Vec("3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"));
    EXPECT_THROW(ED25519Key key8(publicKey8, privateKey8), invalid_argument);
}

TEST(ED25519Key, signs_and_verifies_messages) {
    uint8_t rawData1[] = "Hello World!";
    vector<uint8_t> message1(rawData1, rawData1 + sizeof(rawData1) - 1);
    ED25519Key key1;
    vector<uint8_t> signature1(key1.Sign(message1));

    EXPECT_THAT(signature1, SizeIs(ED25519Key::SIGNATURE_SIZE));
    EXPECT_TRUE(key1.Verify(message1, signature1));

    uint8_t rawData2[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    vector<uint8_t> message2(rawData2, rawData2 + sizeof(rawData2) - 1);
    ED25519Key key2;
    vector<uint8_t> signature2(key2.Sign(message2));

    EXPECT_THAT(signature2, SizeIs(ED25519Key::SIGNATURE_SIZE));
    EXPECT_TRUE(key2.Verify(message2, signature2));

    EXPECT_FALSE(key1.Verify(message2, signature1));
    EXPECT_FALSE(key1.Verify(message1, signature2));
    EXPECT_FALSE(key1.Verify(message2, signature2));
    EXPECT_FALSE(key2.Verify(message2, signature1));
    EXPECT_FALSE(key2.Verify(message1, signature2));
    EXPECT_FALSE(key2.Verify(message1, signature1));
}

TEST(ED25519Key, throws_on_invalid_arguments_signs_and_verifies_messages) {
    // Empty message.
    vector<uint8_t> message1;
    ED25519Key key1;
    EXPECT_THROW(key1.Sign(message1), invalid_argument);

    // No private key.
    uint8_t rawData2[] = "Hello World!";
    vector<uint8_t> message2(rawData2, rawData2 + sizeof(rawData2) - 1);
    vector<uint8_t> publicKey2(Utils::Hex2Vec("b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"));
    ED25519Key key2(publicKey2);
    EXPECT_THROW(key2.Sign(message2), logic_error);

    // Empty signature.
    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    vector<uint8_t> message3(rawData3, rawData3 + sizeof(rawData3) - 1);
    ED25519Key key3;
    vector<uint8_t> signature3;
    EXPECT_THROW(key3.Verify(message3, signature3), invalid_argument);

    // Signature is too short.
    uint8_t rawData4[] = "Hello World!";
    vector<uint8_t> message4(rawData4, rawData4 + sizeof(rawData4) - 1);
    ED25519Key key4;
    vector<uint8_t> signature4(key4.Sign(message4));
    signature4.pop_back();
    EXPECT_THROW(key4.Verify(message4, signature4), invalid_argument);

    // Signature is too long.
    uint8_t rawData5[] = "Hello World!";
    vector<uint8_t> message5(rawData5, rawData5 + sizeof(rawData5) - 1);
    ED25519Key key5;
    vector<uint8_t> signature5(key5.Sign(message5));
    signature5.push_back(12);
    EXPECT_THROW(key5.Verify(message5, signature5), invalid_argument);
}
