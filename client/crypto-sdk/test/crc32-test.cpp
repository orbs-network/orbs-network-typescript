#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/crc32.h"
#include "../lib/utils.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(Hash, computes_binary_CRC32_of_binary) {
    vector<uint8_t> res;

    vector<uint8_t> data1;
    CRC32::Hash(data1, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("00000000")));

    uint8_t rawData2[] = "Hello World!";
    vector<uint8_t> data2(rawData2, rawData2 + sizeof(rawData2) - 1);
    CRC32::Hash(data2, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("1c291ca3")));

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    vector<uint8_t> data3(rawData3, rawData3 + sizeof(rawData3) - 1);
    CRC32::Hash(data3, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("75e33aef")));

    uint8_t rawData4[] = "אורבס";
    vector<uint8_t> data4(rawData4, rawData4 + sizeof(rawData4) - 1);
    CRC32::Hash(data4, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("426cf367")));
}

TEST(Hash, computes_binary_CRC32_of_string) {
    vector<uint8_t> res;

    CRC32::Hash("", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("00000000")));

    CRC32::Hash("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("1c291ca3")));

    CRC32::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("75e33aef")));

    CRC32::Hash("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("426cf367")));
}

TEST(Hash, computes_string_CRC32_of_binary) {
    string res;

    vector<uint8_t> data1;
    CRC32::Hash(data1, res);
    EXPECT_STREQ(res.c_str(), "00000000");

    uint8_t rawData2[] = "Hello World!";
    vector<uint8_t> data2(rawData2, rawData2 + sizeof(rawData2) - 1);
    CRC32::Hash(data2, res);
    EXPECT_STREQ(res.c_str(), "1c291ca3");

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    vector<uint8_t> data3(rawData3, rawData3 + sizeof(rawData3) - 1);
    CRC32::Hash(data3, res);
    EXPECT_STREQ(res.c_str(), "75e33aef");

    uint8_t rawData4[] = "אורבס";
    vector<uint8_t> data4(rawData4, rawData4 + sizeof(rawData4) - 1);
    CRC32::Hash(data4, res);
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
