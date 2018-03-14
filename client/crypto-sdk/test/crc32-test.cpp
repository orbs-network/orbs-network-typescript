#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/crc32.h"

using namespace std;
using namespace testing;
using namespace Orbs;

static const uint CRC32_DIGEST_LENGTH = 4;

TEST(Hash, computes_binary_CRC32_of_binary) {
    vector<uint8_t> res;
    vector<uint8_t> data;

    uint8_t rawData[] = "";
    data = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    CRC32::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x00\x00\x00\x00", CRC32_DIGEST_LENGTH));

    uint8_t rawData2[] = "Hello World!";
    data = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    CRC32::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x1c\x29\x1c\xa3", CRC32_DIGEST_LENGTH));

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData3, rawData3 + sizeof(rawData3) - 1);
    CRC32::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x75\xe3\x3a\xef", CRC32_DIGEST_LENGTH));

    uint8_t rawData4[] = "אורבס";
    data = vector<uint8_t>(rawData4, rawData4 + sizeof(rawData4) - 1);
    CRC32::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x42\x6c\xf3\x67", CRC32_DIGEST_LENGTH));
}

TEST(Hash, computes_binary_CRC32_of_string) {
    vector<uint8_t> res;

    CRC32::Hash("", res);
    EXPECT_THAT(res, ElementsAreArray("\x00\x00\x00\x00", CRC32_DIGEST_LENGTH));

    CRC32::Hash("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray("\x1c\x29\x1c\xa3", CRC32_DIGEST_LENGTH));

    CRC32::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray("\x75\xe3\x3a\xef", CRC32_DIGEST_LENGTH));

    CRC32::Hash("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray("\x42\x6c\xf3\x67", CRC32_DIGEST_LENGTH));
}

TEST(Hash, computes_string_CRC32_of_binary) {
    string res;
    vector<uint8_t> data;

    uint8_t rawData[] = "";
    data = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    CRC32::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "00000000");

    uint8_t rawData2[] = "Hello World!";
    data = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    CRC32::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "1c291ca3");

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData3, rawData3 + sizeof(rawData3) - 1);
    CRC32::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "75e33aef");

    uint8_t rawData4[] = "אורבס";
    data = vector<uint8_t>(rawData4, rawData4 + sizeof(rawData4) - 1);
    CRC32::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "426cf367");
}

TEST(Hash, computes_string_CRC32_of_string) {
    string res;

    CRC32::Hash("", res);
    EXPECT_STREQ(res.c_str(), "00000000");

    CRC32::Hash("Hello World!", res);
    EXPECT_STREQ(res.c_str(), "1c291ca3");

    CRC32::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_STREQ(res.c_str(), "75e33aef");

    CRC32::Hash("אורבס", res);
    EXPECT_STREQ(res.c_str(), "426cf367");
}

