#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/ripemd160.h"
#include "../lib/utils.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(Hash, computes_binary_RIPEMD160_of_binary) {
    vector<uint8_t> res;
    vector<uint8_t> data;

    uint8_t rawData[] = "";
    data = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("9c1185a5c5e9fc54612808977ee8f548b2258d31")));

    uint8_t rawData2[] = "Hello World!";
    data = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("8476ee4631b9b30ac2754b0ee0c47e161d3f724c")));

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData3, rawData3 + sizeof(rawData3) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("128c3544ca79c4c04cadd7eba5053eb6f5dadfdf")));

    uint8_t rawData4[] = "אורבס";
    data = vector<uint8_t>(rawData4, rawData4 + sizeof(rawData4) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("00d229fc91599f0c5f676b4506073cd63f196986")));
}

TEST(Hash, computes_binary_RIPEMD160_of_string) {
    vector<uint8_t> res;

    RIPEMD160::Hash("", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("9c1185a5c5e9fc54612808977ee8f548b2258d31")));

    RIPEMD160::Hash("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("8476ee4631b9b30ac2754b0ee0c47e161d3f724c")));

    RIPEMD160::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("128c3544ca79c4c04cadd7eba5053eb6f5dadfdf")));

    RIPEMD160::Hash("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("00d229fc91599f0c5f676b4506073cd63f196986")));
}

TEST(Hash, computes_string_RIPEMD160_of_binary) {
    string res;
    vector<uint8_t> data;

    uint8_t rawData[] = "";
    data = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "9c1185a5c5e9fc54612808977ee8f548b2258d31");

    uint8_t rawData2[] = "Hello World!";
    data = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "8476ee4631b9b30ac2754b0ee0c47e161d3f724c");

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData3, rawData3 + sizeof(rawData3) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "128c3544ca79c4c04cadd7eba5053eb6f5dadfdf");

    uint8_t rawData4[] = "אורבס";
    data = vector<uint8_t>(rawData4, rawData4 + sizeof(rawData4) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_STREQ(res.c_str(), "00d229fc91599f0c5f676b4506073cd63f196986");
}

TEST(Hash, computes_string_RIPEMD160_of_string) {
    string res;

    RIPEMD160::Hash("", res);
    EXPECT_STREQ(res.c_str(), "9c1185a5c5e9fc54612808977ee8f548b2258d31");

    RIPEMD160::Hash("Hello World!", res);
    EXPECT_STREQ(res.c_str(), "8476ee4631b9b30ac2754b0ee0c47e161d3f724c");

    RIPEMD160::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_STREQ(res.c_str(), "128c3544ca79c4c04cadd7eba5053eb6f5dadfdf");

    RIPEMD160::Hash("אורבס", res);
    EXPECT_STREQ(res.c_str(), "00d229fc91599f0c5f676b4506073cd63f196986");
}
