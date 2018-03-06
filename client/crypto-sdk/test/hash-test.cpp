#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/hash.h"

using namespace std;
using namespace testing;
using namespace Orbs;

// SHA256 tests:

TEST(Hash, returns_binary_SHA256_of_binary) {
    vector<uint8_t> res;
    vector<uint8_t> data;
    string rawData;

    rawData = "";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_THAT(res, ElementsAreArray("\xe3\xb0\xc4\x42\x98\xfc\x1c\x14\x9a\xfb\xf4\xc8\x99\x6f\xb9\x24\x27\xae\x41\xe4\x64\x9b\x93\x4c\xa4\x95\x99\x1b\x78\x52\xb8\x55", 32));

    rawData = "Hello World!";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x7f\x83\xb1\x65\x7f\xf1\xfc\x53\xb9\x2d\xc1\x81\x48\xa1\xd6\x5d\xfc\x2d\x4b\x1f\xa3\xd6\x77\x28\x4a\xdd\xd2\x00\x12\x6d\x90\x69", 32));

    rawData = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x24\x87\x08\x58\xd5\xc3\xe7\x67\xcf\x2d\x3c\xeb\x2e\x27\xdd\xa0\x9c\x56\x6d\x1e\xc5\xc7\xd5\x25\x41\x82\x97\x11\x14\xf2\xea\x66", 32));

    rawData = "אורבס";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_THAT(res, ElementsAreArray("\xb4\x84\xa0\x30\xe6\xea\x71\x5b\x5a\xdb\x74\x30\x1a\x7f\x46\x74\xd1\x44\xaf\x61\xf0\x8f\x77\x6c\x69\xcf\x16\xc2\x8a\x86\xb3\x4b", 32));
}

TEST(Hash, returns_binary_SHA256_of_string) {
    vector<uint8_t> res;

    Hash::SHA256("", res);
    EXPECT_THAT(res, ElementsAreArray("\xe3\xb0\xc4\x42\x98\xfc\x1c\x14\x9a\xfb\xf4\xc8\x99\x6f\xb9\x24\x27\xae\x41\xe4\x64\x9b\x93\x4c\xa4\x95\x99\x1b\x78\x52\xb8\x55", 32));

    Hash::SHA256("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray("\x7f\x83\xb1\x65\x7f\xf1\xfc\x53\xb9\x2d\xc1\x81\x48\xa1\xd6\x5d\xfc\x2d\x4b\x1f\xa3\xd6\x77\x28\x4a\xdd\xd2\x00\x12\x6d\x90\x69", 32));

    Hash::SHA256("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray("\x24\x87\x08\x58\xd5\xc3\xe7\x67\xcf\x2d\x3c\xeb\x2e\x27\xdd\xa0\x9c\x56\x6d\x1e\xc5\xc7\xd5\x25\x41\x82\x97\x11\x14\xf2\xea\x66", 32));

    Hash::SHA256("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray("\xb4\x84\xa0\x30\xe6\xea\x71\x5b\x5a\xdb\x74\x30\x1a\x7f\x46\x74\xd1\x44\xaf\x61\xf0\x8f\x77\x6c\x69\xcf\x16\xc2\x8a\x86\xb3\x4b", 32));
}

TEST(Hash, returns_string_SHA256_of_binary) {
    string res;
    vector<uint8_t> data;
    string rawData;

    rawData = "";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_EQ(res, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

    rawData = "Hello World!";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_EQ(res, "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069");

    rawData = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_EQ(res, "24870858d5c3e767cf2d3ceb2e27dda09c566d1ec5c7d5254182971114f2ea66");

    rawData = "אורבס";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_EQ(res, "b484a030e6ea715b5adb74301a7f4674d144af61f08f776c69cf16c28a86b34b");
}

TEST(Hash, returns_string_SHA256_of_string) {
    string res;

    Hash::SHA256("", res);
    EXPECT_EQ(res, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

    Hash::SHA256("Hello World!", res);
    EXPECT_EQ(res, "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069");

    Hash::SHA256("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_EQ(res, "24870858d5c3e767cf2d3ceb2e27dda09c566d1ec5c7d5254182971114f2ea66");

    Hash::SHA256("אורבס", res);
    EXPECT_EQ(res, "b484a030e6ea715b5adb74301a7f4674d144af61f08f776c69cf16c28a86b34b");
}

// RIPEMD160 tests:

TEST(Hash, returns_binary_RIPEMD160_of_binary) {
    vector<uint8_t> res;
    vector<uint8_t> data;
    string rawData;

    rawData = "";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::RIPEMD160(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x9c\x11\x85\xa5\xc5\xe9\xfc\x54\x61\x28\x08\x97\x7e\xe8\xf5\x48\xb2\x25\x8d\x31", 20));

    rawData = "Hello World!";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::RIPEMD160(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x84\x76\xee\x46\x31\xb9\xb3\x0a\xc2\x75\x4b\x0e\xe0\xc4\x7e\x16\x1d\x3f\x72\x4c", 20));

    rawData = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::RIPEMD160(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x12\x8c\x35\x44\xca\x79\xc4\xc0\x4c\xad\xd7\xeb\xa5\x05\x3e\xb6\xf5\xda\xdf\xdf", 20));

    rawData = "אורבס";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::RIPEMD160(data, res);
    EXPECT_THAT(res, ElementsAreArray("\x00\xd2\x29\xfc\x91\x59\x9f\x0c\x5f\x67\x6b\x45\x06\x07\x3c\xd6\x3f\x19\x69\x86", 20));
}

TEST(Hash, returns_binary_RIPEMD160_of_string) {
    vector<uint8_t> res;

    Hash::RIPEMD160("", res);
    EXPECT_THAT(res, ElementsAreArray("\x9c\x11\x85\xa5\xc5\xe9\xfc\x54\x61\x28\x08\x97\x7e\xe8\xf5\x48\xb2\x25\x8d\x31", 20));

    Hash::RIPEMD160("Hello World!", res);
    EXPECT_THAT(res, ElementsAreArray("\x84\x76\xee\x46\x31\xb9\xb3\x0a\xc2\x75\x4b\x0e\xe0\xc4\x7e\x16\x1d\x3f\x72\x4c", 20));

    Hash::RIPEMD160("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_THAT(res, ElementsAreArray("\x12\x8c\x35\x44\xca\x79\xc4\xc0\x4c\xad\xd7\xeb\xa5\x05\x3e\xb6\xf5\xda\xdf\xdf", 20));

    Hash::RIPEMD160("אורבס", res);
    EXPECT_THAT(res, ElementsAreArray("\x00\xd2\x29\xfc\x91\x59\x9f\x0c\x5f\x67\x6b\x45\x06\x07\x3c\xd6\x3f\x19\x69\x86", 20));
}

TEST(Hash, returns_string_RIPEMD160_of_binary) {
    string res;
    vector<uint8_t> data;
    string rawData;

    rawData = "";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::RIPEMD160(data, res);
    EXPECT_EQ(res, "9c1185a5c5e9fc54612808977ee8f548b2258d31");

    rawData = "Hello World!";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::RIPEMD160(data, res);
    EXPECT_EQ(res, "8476ee4631b9b30ac2754b0ee0c47e161d3f724c");

    rawData = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::RIPEMD160(data, res);
    EXPECT_EQ(res, "128c3544ca79c4c04cadd7eba5053eb6f5dadfdf");

    rawData = "אורבס";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::RIPEMD160(data, res);
    EXPECT_EQ(res, "00d229fc91599f0c5f676b4506073cd63f196986");
}

TEST(Hash, returns_string_RIPEMD160_of_string) {
    string res;

    Hash::RIPEMD160("", res);
    EXPECT_EQ(res, "9c1185a5c5e9fc54612808977ee8f548b2258d31");

    Hash::RIPEMD160("Hello World!", res);
    EXPECT_EQ(res, "8476ee4631b9b30ac2754b0ee0c47e161d3f724c");

    Hash::RIPEMD160("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.", res);
    EXPECT_EQ(res, "128c3544ca79c4c04cadd7eba5053eb6f5dadfdf");

    Hash::RIPEMD160("אורבס", res);
    EXPECT_EQ(res, "00d229fc91599f0c5f676b4506073cd63f196986");
}
