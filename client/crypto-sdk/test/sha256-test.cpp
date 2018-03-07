#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/sha256.h"

using namespace std;
using namespace testing;
using namespace Orbs;

static const uint SHA256_DIGEST_LENGTH = 32;

TEST(Hash, computes_binary_SHA256_of_binary) {
    vector<uint8_t> res;
    vector<uint8_t> data;
    string rawData;

    rawData = "";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    SHA256::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\xe3\xb0\xc4\x42\x98\xfc\x1c\x14\x9a\xfb\xf4\xc8\x99\x6f\xb9\x24\x27\xae\x41\xe4\x64\x9b\x93\x4c\xa4\x95\x99\x1b\x78\x52\xb8\x55", SHA256_DIGEST_LENGTH));

    rawData = "Hello World!";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    SHA256::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x7f\x83\xb1\x65\x7f\xf1\xfc\x53\xb9\x2d\xc1\x81\x48\xa1\xd6\x5d\xfc\x2d\x4b\x1f\xa3\xd6\x77\x28\x4a\xdd\xd2\x00\x12\x6d\x90\x69", SHA256_DIGEST_LENGTH));

    rawData = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    SHA256::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x24\x87\x08\x58\xd5\xc3\xe7\x67\xcf\x2d\x3c\xeb\x2e\x27\xdd\xa0\x9c\x56\x6d\x1e\xc5\xc7\xd5\x25\x41\x82\x97\x11\x14\xf2\xea\x66", SHA256_DIGEST_LENGTH));

    rawData = "אורבס";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    SHA256::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\xb4\x84\xa0\x30\xe6\xea\x71\x5b\x5a\xdb\x74\x30\x1a\x7f\x46\x74\xd1\x44\xaf\x61\xf0\x8f\x77\x6c\x69\xcf\x16\xc2\x8a\x86\xb3\x4b", SHA256_DIGEST_LENGTH));
}

TEST(Hash, computes_binary_SHA256_of_string) {
    vector<uint8_t> res;

    SHA256::Hash("", res);
    EXPECT_THAT(res, ElementsAreArray("\xe3\xb0\xc4\x42\x98\xfc\x1c\x14\x9a\xfb\xf4\xc8\x99\x6f\xb9\x24\x27\xae\x41\xe4\x64\x9b\x93\x4c\xa4\x95\x99\x1b\x78\x52\xb8\x55", SHA256_DIGEST_LENGTH));

    SHA256::Hash("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray("\x7f\x83\xb1\x65\x7f\xf1\xfc\x53\xb9\x2d\xc1\x81\x48\xa1\xd6\x5d\xfc\x2d\x4b\x1f\xa3\xd6\x77\x28\x4a\xdd\xd2\x00\x12\x6d\x90\x69", SHA256_DIGEST_LENGTH));

    SHA256::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray("\x24\x87\x08\x58\xd5\xc3\xe7\x67\xcf\x2d\x3c\xeb\x2e\x27\xdd\xa0\x9c\x56\x6d\x1e\xc5\xc7\xd5\x25\x41\x82\x97\x11\x14\xf2\xea\x66", SHA256_DIGEST_LENGTH));

    SHA256::Hash("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray("\xb4\x84\xa0\x30\xe6\xea\x71\x5b\x5a\xdb\x74\x30\x1a\x7f\x46\x74\xd1\x44\xaf\x61\xf0\x8f\x77\x6c\x69\xcf\x16\xc2\x8a\x86\xb3\x4b", SHA256_DIGEST_LENGTH));
}

TEST(Hash, computes_string_SHA256_of_binary) {
    string res;
    vector<uint8_t> data;
    string rawData;

    rawData = "";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    SHA256::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

    rawData = "Hello World!";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    SHA256::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069");

    rawData = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    SHA256::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "24870858d5c3e767cf2d3ceb2e27dda09c566d1ec5c7d5254182971114f2ea66");

    rawData = "אורבס";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    SHA256::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "b484a030e6ea715b5adb74301a7f4674d144af61f08f776c69cf16c28a86b34b");
}

TEST(Hash, computes_string_SHA256_of_string) {
    string res;

    SHA256::Hash("", res);
    EXPECT_STREQ(res.c_str(), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

    SHA256::Hash("Hello World!", res);
    EXPECT_STREQ(res.c_str(), "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069");

    SHA256::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_STREQ(res.c_str(), "24870858d5c3e767cf2d3ceb2e27dda09c566d1ec5c7d5254182971114f2ea66");

    SHA256::Hash("אורבס", res);
    EXPECT_STREQ(res.c_str(), "b484a030e6ea715b5adb74301a7f4674d144af61f08f776c69cf16c28a86b34b");
}

