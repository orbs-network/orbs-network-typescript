#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/ripemd160.h"

using namespace std;
using namespace testing;
using namespace Orbs;

static const uint RIPEMD160_DIGEST_LENGTH = 20;

TEST(Hash, computes_binary_RIPEMD160_of_binary) {
    vector<uint8_t> res;
    vector<uint8_t> data;

    uint8_t rawData[] = "";
    data = vector<uint8_t>(rawData, rawData + sizeof(rawData) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x9c\x11\x85\xa5\xc5\xe9\xfc\x54\x61\x28\x08\x97\x7e\xe8\xf5\x48\xb2\x25\x8d\x31", RIPEMD160_DIGEST_LENGTH));

    uint8_t rawData2[] = "Hello World!";
    data = vector<uint8_t>(rawData2, rawData2 + sizeof(rawData2) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x84\x76\xee\x46\x31\xb9\xb3\x0a\xc2\x75\x4b\x0e\xe0\xc4\x7e\x16\x1d\x3f\x72\x4c", RIPEMD160_DIGEST_LENGTH));

    uint8_t rawData3[] = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData3, rawData3 + sizeof(rawData3) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x12\x8c\x35\x44\xca\x79\xc4\xc0\x4c\xad\xd7\xeb\xa5\x05\x3e\xb6\xf5\xda\xdf\xdf", RIPEMD160_DIGEST_LENGTH));

    uint8_t rawData4[] = "אורבס";
    data = vector<uint8_t>(rawData4, rawData4 + sizeof(rawData4) - 1);
    RIPEMD160::Hash(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x00\xd2\x29\xfc\x91\x59\x9f\x0c\x5f\x67\x6b\x45\x06\x07\x3c\xd6\x3f\x19\x69\x86", RIPEMD160_DIGEST_LENGTH));
}

TEST(Hash, computes_binary_RIPEMD160_of_string) {
    vector<uint8_t> res;

    RIPEMD160::Hash("", res);
    EXPECT_THAT(res, ElementsAreArray("\x9c\x11\x85\xa5\xc5\xe9\xfc\x54\x61\x28\x08\x97\x7e\xe8\xf5\x48\xb2\x25\x8d\x31", RIPEMD160_DIGEST_LENGTH));

    RIPEMD160::Hash("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray("\x84\x76\xee\x46\x31\xb9\xb3\x0a\xc2\x75\x4b\x0e\xe0\xc4\x7e\x16\x1d\x3f\x72\x4c", RIPEMD160_DIGEST_LENGTH));

    RIPEMD160::Hash("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray("\x12\x8c\x35\x44\xca\x79\xc4\xc0\x4c\xad\xd7\xeb\xa5\x05\x3e\xb6\xf5\xda\xdf\xdf", RIPEMD160_DIGEST_LENGTH));

    RIPEMD160::Hash("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray("\x00\xd2\x29\xfc\x91\x59\x9f\x0c\x5f\x67\x6b\x45\x06\x07\x3c\xd6\x3f\x19\x69\x86", RIPEMD160_DIGEST_LENGTH));
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
