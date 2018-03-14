#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/sha512.h"

using namespace std;
using namespace testing;
using namespace Orbs;

static const uint SHA512_DIGEST_LENGTH = 64;

TEST(Hash, computes_binary_SHA512_of_binary) {
    vector<uint8_t> res;
    vector<uint8_t> data;

    uint8_t rawData[] = "";
    data = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    SHA512::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\xcf\x83\xe1\x35\x7e\xef\xb8\xbd\xf1\x54\x28\x50\xd6\x6d\x80\x07\xd6\x20\xe4\x05\x0b\x57\x15\xdc\x83\xf4\xa9\x21\xd3\x6c\xe9\xce\x47\xd0\xd1\x3c\x5d\x85\xf2\xb0\xff\x83\x18\xd2\x87\x7e\xec\x2f\x63\xb9\x31\xbd\x47\x41\x7a\x81\xa5\x38\x32\x7a\xf9\x27\xda\x3e", SHA512_DIGEST_LENGTH));

    uint8_t rawData2[] = "Hello World!";
    data = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    SHA512::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x86\x18\x44\xd6\x70\x4e\x85\x73\xfe\xc3\x4d\x96\x7e\x20\xbc\xfe\xf3\xd4\x24\xcf\x48\xbe\x04\xe6\xdc\x08\xf2\xbd\x58\xc7\x29\x74\x33\x71\x01\x5e\xad\x89\x1c\xc3\xcf\x1c\x9d\x34\xb4\x92\x64\xb5\x10\x75\x1b\x1f\xf9\xe5\x37\x93\x7b\xc4\x6b\x5d\x6f\xf4\xec\xc8", SHA512_DIGEST_LENGTH));

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData3, rawData3 + sizeof(rawData3) - 1);
    SHA512::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\xd4\x00\x82\x36\x0b\x0a\xd0\x5d\x5b\x95\x04\x1e\x11\xd8\xd0\xc6\xff\xc6\x01\x8d\x0b\x8d\xe8\x60\xa5\x5e\x94\xc9\x29\xbb\x48\xe1\xcd\xb6\x6d\x02\x0a\x42\x18\x2b\x86\x8f\x80\x06\x48\xa2\x22\x8f\xb7\xf5\xda\xfe\x0e\x1a\xc9\x6a\x73\xcd\x91\x30\xed\x6d\x75\xa5", SHA512_DIGEST_LENGTH));

    uint8_t rawData4[] = "אורבס";
    data = vector<uint8_t>(rawData4, rawData4 + sizeof(rawData4) - 1);
    SHA512::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\xbd\xa6\xd4\x7b\x74\x33\xdf\x14\x7c\xaa\xab\xfb\x0e\x99\x95\x90\x94\xd6\x18\x90\x82\xc2\xe4\x1a\x55\x00\xfd\x8e\x6f\xfa\xec\x9e\xf0\x01\x55\x98\x10\x3c\x7f\x02\xdc\xf5\xa2\x7f\xf1\x8b\x46\xd0\xf6\xb2\x87\x83\xee\xf1\x4b\x66\x89\x5b\xe1\xb9\xd5\xc8\x18\xb7", SHA512_DIGEST_LENGTH));
}

TEST(Hash, computes_binary_SHA512_of_string) {
    vector<uint8_t> res;

    SHA512::Hash("", res);
    EXPECT_THAT(res, ElementsAreArray("\xcf\x83\xe1\x35\x7e\xef\xb8\xbd\xf1\x54\x28\x50\xd6\x6d\x80\x07\xd6\x20\xe4\x05\x0b\x57\x15\xdc\x83\xf4\xa9\x21\xd3\x6c\xe9\xce\x47\xd0\xd1\x3c\x5d\x85\xf2\xb0\xff\x83\x18\xd2\x87\x7e\xec\x2f\x63\xb9\x31\xbd\x47\x41\x7a\x81\xa5\x38\x32\x7a\xf9\x27\xda\x3e", SHA512_DIGEST_LENGTH));

    SHA512::Hash("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray("\x86\x18\x44\xd6\x70\x4e\x85\x73\xfe\xc3\x4d\x96\x7e\x20\xbc\xfe\xf3\xd4\x24\xcf\x48\xbe\x04\xe6\xdc\x08\xf2\xbd\x58\xc7\x29\x74\x33\x71\x01\x5e\xad\x89\x1c\xc3\xcf\x1c\x9d\x34\xb4\x92\x64\xb5\x10\x75\x1b\x1f\xf9\xe5\x37\x93\x7b\xc4\x6b\x5d\x6f\xf4\xec\xc8", SHA512_DIGEST_LENGTH));

    SHA512::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray("\xd4\x00\x82\x36\x0b\x0a\xd0\x5d\x5b\x95\x04\x1e\x11\xd8\xd0\xc6\xff\xc6\x01\x8d\x0b\x8d\xe8\x60\xa5\x5e\x94\xc9\x29\xbb\x48\xe1\xcd\xb6\x6d\x02\x0a\x42\x18\x2b\x86\x8f\x80\x06\x48\xa2\x22\x8f\xb7\xf5\xda\xfe\x0e\x1a\xc9\x6a\x73\xcd\x91\x30\xed\x6d\x75\xa5", SHA512_DIGEST_LENGTH));

    SHA512::Hash("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray("\xbd\xa6\xd4\x7b\x74\x33\xdf\x14\x7c\xaa\xab\xfb\x0e\x99\x95\x90\x94\xd6\x18\x90\x82\xc2\xe4\x1a\x55\x00\xfd\x8e\x6f\xfa\xec\x9e\xf0\x01\x55\x98\x10\x3c\x7f\x02\xdc\xf5\xa2\x7f\xf1\x8b\x46\xd0\xf6\xb2\x87\x83\xee\xf1\x4b\x66\x89\x5b\xe1\xb9\xd5\xc8\x18\xb7", SHA512_DIGEST_LENGTH));
}

TEST(Hash, computes_string_SHA512_of_binary) {
    string res;
    vector<uint8_t> data;

    uint8_t rawData[] = "";
    data = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    SHA512::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e");

    uint8_t rawData2[] = "Hello World!";
    data = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    SHA512::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8");

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData3, rawData3 + sizeof(rawData3) - 1);
    SHA512::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "d40082360b0ad05d5b95041e11d8d0c6ffc6018d0b8de860a55e94c929bb48e1cdb66d020a42182b868f800648a2228fb7f5dafe0e1ac96a73cd9130ed6d75a5");

    uint8_t rawData4[] = "אורבס";
    data = vector<uint8_t>(rawData4, rawData4 + sizeof(rawData4) - 1);
    SHA512::Hash(data, res);
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

