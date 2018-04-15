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

TEST(Utils, converts_hex_to_vector) {
    vector<uint8_t> res;

    res = Utils::Hex2Vec("");
    EXPECT_THAT(res, IsEmpty());

    res = Utils::Hex2Vec("e3b0c44298fc1c149afbf4c8");
    EXPECT_THAT(res, ElementsAreArray("\xe3\xb0\xc4\x42\x98\xfc\x1c\x14\x9a\xfb\xf4\xc8", 12));

    res = Utils::Hex2Vec("E3B0C44298FC1C149AFBF4C8");
    EXPECT_THAT(res, ElementsAreArray("\xe3\xb0\xc4\x42\x98\xfc\x1c\x14\x9a\xfb\xf4\xc8", 12));

    res = Utils::Hex2Vec("7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069");
    EXPECT_THAT(res, ElementsAreArray("\x7f\x83\xb1\x65\x7f\xf1\xfc\x53\xb9\x2d\xc1\x81\x48\xa1\xd6\x5d\xfc\x2d\x4b\x1f\xa3\xd6\x77\x28\x4a\xdd\xd2\x00\x12\x6d\x90\x69", 32));

    res = Utils::Hex2Vec("7F83B1657FF1FC53B92DC18148A1D65DFC2D4B1FA3D677284ADDD200126D9069");
    EXPECT_THAT(res, ElementsAreArray("\x7f\x83\xb1\x65\x7f\xf1\xfc\x53\xb9\x2d\xc1\x81\x48\xa1\xd6\x5d\xfc\x2d\x4b\x1f\xa3\xd6\x77\x28\x4a\xdd\xd2\x00\x12\x6d\x90\x69", 32));
}

TEST(Utils, throws_on_invalid_hex_converts_hex_to_vector) {
    vector<uint8_t> res;

    // Invalid characters:
    EXPECT_THROW(Utils::Hex2Vec("e3b0c44298fc1cr49afbf4c8"), invalid_argument);
    EXPECT_THROW(Utils::Hex2Vec("e3b0c44298fc1c149+fbf4c8"), invalid_argument);
    EXPECT_THROW(Utils::Hex2Vec("Z3b0c44298fc1c149afbf4c8"), invalid_argument);

    // Odd length:
    EXPECT_THROW(Utils::Hex2Vec("e3b0c44298fc1c149afbf4c"), invalid_argument);
    EXPECT_THROW(Utils::Hex2Vec("E3B0C44298FC1C149AFBF4C"), invalid_argument);
}

TEST(Utils, converts_value_to_string) {
    string res;

    res = Utils::ToString(1);
    EXPECT_STREQ(res.c_str(), "1");

    res = Utils::ToString(0);
    EXPECT_STREQ(res.c_str(), "0");

    res = Utils::ToString(000);
    EXPECT_STREQ(res.c_str(), "0");

    res = Utils::ToString("Hello World!");
    EXPECT_STREQ(res.c_str(), "Hello World!");
}
