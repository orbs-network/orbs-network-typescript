#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/utils.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(Utils, converts_vector_to_hex) {
    vector<uint8_t> data;
    string res;

    uint8_t rawData[] = "";
    data = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    res = Utils::Vec2Hex(data);
    EXPECT_STREQ(res.c_str(), "");

    uint8_t rawData2[] = "\xe3\xb0\xc4\x42\x98\xfc\x1c\x14\x9a\xfb\xf4\xc8";
    data = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    res = Utils::Vec2Hex(data);
    EXPECT_STREQ(res.c_str(), "e3b0c44298fc1c149afbf4c8");

    uint8_t rawData3[] = "\x7f\x83\xb1\x65\x7f\xf1\xfc\x53\xb9\x2d\xc1\x81\x48\xa1\xd6\x5d\xfc\x2d\x4b\x1f\xa3\xd6\x77\x28\x4a\xdd\xd2\x00\x12\x6d\x90\x69";
    data = vector<uint8_t>(rawData3, rawData3 + sizeof(rawData3) - 1);
    res = Utils::Vec2Hex(data);
    EXPECT_STREQ(res.c_str(), "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069");
}
