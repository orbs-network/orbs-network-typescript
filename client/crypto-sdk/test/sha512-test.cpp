#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/sha512.h"
#include "../lib/utils.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(Hash, computes_binary_SHA512_of_binary) {
    vector<uint8_t> res;

    vector<uint8_t> data1;
    SHA512::Hash(data1, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e")));

    uint8_t rawData2[] = "Hello World!";
    vector<uint8_t> data2(rawData2, rawData2 + sizeof(rawData2) - 1);
    SHA512::Hash(data2, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8")));

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    vector<uint8_t> data3(rawData3, rawData3 + sizeof(rawData3) - 1);
    SHA512::Hash(data3, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("d40082360b0ad05d5b95041e11d8d0c6ffc6018d0b8de860a55e94c929bb48e1cdb66d020a42182b868f800648a2228fb7f5dafe0e1ac96a73cd9130ed6d75a5")));

    uint8_t rawData4[] = "אורבס";
    vector<uint8_t> data4(rawData4, rawData4 + sizeof(rawData4) - 1);
    SHA512::Hash(data4, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("bda6d47b7433df147caaabfb0e99959094d6189082c2e41a5500fd8e6ffaec9ef0015598103c7f02dcf5a27ff18b46d0f6b28783eef14b66895be1b9d5c818b7")));
}

TEST(Hash, computes_binary_SHA512_of_string) {
    vector<uint8_t> res;

    SHA512::Hash("", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e")));

    SHA512::Hash("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8")));

    SHA512::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("d40082360b0ad05d5b95041e11d8d0c6ffc6018d0b8de860a55e94c929bb48e1cdb66d020a42182b868f800648a2228fb7f5dafe0e1ac96a73cd9130ed6d75a5")));

    SHA512::Hash("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("bda6d47b7433df147caaabfb0e99959094d6189082c2e41a5500fd8e6ffaec9ef0015598103c7f02dcf5a27ff18b46d0f6b28783eef14b66895be1b9d5c818b7")));
}

TEST(Hash, computes_string_SHA512_of_binary) {
    string res;

    vector<uint8_t> data1;
    SHA512::Hash(data1, res);
    EXPECT_STREQ(res.c_str(), "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e");

    uint8_t rawData2[] = "Hello World!";
    vector<uint8_t> data2(rawData2, rawData2 + sizeof(rawData2) - 1);
    SHA512::Hash(data2, res);
    EXPECT_STREQ(res.c_str(), "861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8");

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    vector<uint8_t> data3(rawData3, rawData3 + sizeof(rawData3) - 1);
    SHA512::Hash(data3, res);
    EXPECT_STREQ(res.c_str(), "d40082360b0ad05d5b95041e11d8d0c6ffc6018d0b8de860a55e94c929bb48e1cdb66d020a42182b868f800648a2228fb7f5dafe0e1ac96a73cd9130ed6d75a5");

    uint8_t rawData4[] = "אורבס";
    vector<uint8_t> data4(rawData4, rawData4 + sizeof(rawData4) - 1);
    SHA512::Hash(data4, res);
    EXPECT_STREQ(res.c_str(), "bda6d47b7433df147caaabfb0e99959094d6189082c2e41a5500fd8e6ffaec9ef0015598103c7f02dcf5a27ff18b46d0f6b28783eef14b66895be1b9d5c818b7");
}

TEST(Hash, computes_string_SHA512_of_string) {
    string res;

    SHA512::Hash("", res);
    EXPECT_STREQ(res.c_str(), "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e");

    SHA512::Hash("Hello World!", res);
    EXPECT_STREQ(res.c_str(), "861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8");

    SHA512::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_STREQ(res.c_str(), "d40082360b0ad05d5b95041e11d8d0c6ffc6018d0b8de860a55e94c929bb48e1cdb66d020a42182b868f800648a2228fb7f5dafe0e1ac96a73cd9130ed6d75a5");

    SHA512::Hash("אורבס", res);
    EXPECT_STREQ(res.c_str(), "bda6d47b7433df147caaabfb0e99959094d6189082c2e41a5500fd8e6ffaec9ef0015598103c7f02dcf5a27ff18b46d0f6b28783eef14b66895be1b9d5c818b7");
}
