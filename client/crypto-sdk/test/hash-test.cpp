#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/hash.h"

using namespace std;
using namespace testing;
using namespace Orbs;

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

    rawData = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prizewinner.";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_THAT(res, ElementsAreArray("\xc8\x5e\x3c\x7e\x98\xcb\x5f\xf5\x72\xf1\x47\x57\x2c\xad\xf9\xef\x06\x5f\x1a\x27\xc9\xe7\xc2\xef\xfe\xe2\xe2\xa4\xdf\x97\x46\x7f", 32));

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

    Hash::SHA256("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prizewinner.", res);
    EXPECT_THAT(res, ElementsAreArray("\xc8\x5e\x3c\x7e\x98\xcb\x5f\xf5\x72\xf1\x47\x57\x2c\xad\xf9\xef\x06\x5f\x1a\x27\xc9\xe7\xc2\xef\xfe\xe2\xe2\xa4\xdf\x97\x46\x7f", 32));

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

    rawData = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prizewinner.";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    Hash::SHA256(data, res);
    EXPECT_EQ(res, "c85e3c7e98cb5ff572f147572cadf9ef065f1a27c9e7c2effee2e2a4df97467f");

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

    Hash::SHA256("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prizewinner.", res);
    EXPECT_EQ(res, "c85e3c7e98cb5ff572f147572cadf9ef065f1a27c9e7c2effee2e2a4df97467f");

    Hash::SHA256("אורבס", res);
    EXPECT_EQ(res, "b484a030e6ea715b5adb74301a7f4674d144af61f08f776c69cf16c28a86b34b");
}
