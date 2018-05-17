#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/sha256.h"
#include "../lib/utils.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(Hash, computes_binary_SHA256_of_binary) {
    vector<uint8_t> res;

    vector<uint8_t> data1;
    SHA256::Hash(data1, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")));

    uint8_t rawData2[] = "Hello World!";
    vector<uint8_t> data2(rawData2, rawData2 + sizeof(rawData2) - 1);
    SHA256::Hash(data2, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069")));

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    vector<uint8_t> data3(rawData3, rawData3 + sizeof(rawData3) - 1);
    SHA256::Hash(data3, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("24870858d5c3e767cf2d3ceb2e27dda09c566d1ec5c7d5254182971114f2ea66")));

    uint8_t rawData4[] = "אורבס";
    vector<uint8_t> data4(rawData4, rawData4 + sizeof(rawData4) - 1);
    SHA256::Hash(data4, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("b484a030e6ea715b5adb74301a7f4674d144af61f08f776c69cf16c28a86b34b")));
}

TEST(Hash, computes_binary_SHA256_of_string) {
    vector<uint8_t> res;

    SHA256::Hash("", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")));

    SHA256::Hash("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069")));

    SHA256::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("24870858d5c3e767cf2d3ceb2e27dda09c566d1ec5c7d5254182971114f2ea66")));

    SHA256::Hash("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("b484a030e6ea715b5adb74301a7f4674d144af61f08f776c69cf16c28a86b34b")));
}

TEST(Hash, computes_string_SHA256_of_binary) {
    string res;

    vector<uint8_t> data1;
    SHA256::Hash(data1, res);
    EXPECT_STREQ(res.c_str(), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

    uint8_t rawData2[] = "Hello World!";
    vector<uint8_t> data2(rawData2, rawData2 + sizeof(rawData2) - 1);
    SHA256::Hash(data2, res);
    EXPECT_STREQ(res.c_str(), "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069");

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    vector<uint8_t> data3(rawData3, rawData3 + sizeof(rawData3) - 1);
    SHA256::Hash(data3, res);
    EXPECT_STREQ(res.c_str(), "24870858d5c3e767cf2d3ceb2e27dda09c566d1ec5c7d5254182971114f2ea66");

    uint8_t rawData4[] = "אורבס";
    vector<uint8_t> data4(rawData4, rawData4 + sizeof(rawData4) - 1);
    SHA256::Hash(data4, res);
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
