#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/base58.h"
#include "../lib/utils.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(Base58, encodes_bytes_to_base58_encoded_string) {
    string res;
    vector<uint8_t> data;
    string rawData;

    rawData = "";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    res = Base58::Encode(data);
    EXPECT_STREQ(res.c_str(), "");

    rawData = "Hello World!";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    res = Base58::Encode(data);
    EXPECT_STREQ(res.c_str(), "2NEpo7TZRRrLZSi2U");

    rawData = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    res = Base58::Encode(data);
    EXPECT_STREQ(res.c_str(), "4ZQEnoftsztcaHYBqh4CKDX3eKonRn17qHebVBEQXfj6bM9DdxopPsTxth31XnNpJQABLd3NShW619dVwbXJ4A5hT9XD3ne2jqpfYdqXvJi957C8QrYSkabfHieK1jkjbJPadftPAaBnN4dxthoRC32E8pag41i3CvhYrrk");

    rawData = "Hello World With Zeroes!";
    data = vector<uint8_t>(rawData.begin(), rawData.end());
    for (int i = 0; i < 4; ++i) {
        data.insert(data.cbegin(), 0);
    }
    res = Base58::Encode(data);
    EXPECT_STREQ(res.c_str(), "11117bo9qr42A5krwASCZ1XegbfsPucae6U9E");
}

TEST(Base58, decodes_base58_encoded_string_to_bytes) {
    vector<uint8_t> res;

    res = Base58::Decode("");
    EXPECT_THAT(res, IsEmpty());

    res = Base58::Decode("2NEpo7TZRRrLZSi2U");
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("48656c6c6f20576f726c6421")));

    res = Base58::Decode("2vbj8nkKYpsGbfshRaXgGKCBo6qRf139grYSvdqv17RxMu2yHB8o1SUcpqV1fU6orCLcwVbQZY5o95u2mqf4M3tWL1TQhCQsRG5i1ydr5ot7CRJdM7Us49yJhHci1opQjmLuT");
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("496620796f7520646f6e27742062656c69657665206974206f7220646f6e277420676574206974204920646f6e27742068617665207468652074696d6520746f2074727920746f20636f6e76696e636520796f752c204920616d20736f7272792e")));

    res = Base58::Decode("11117bo9qr42A5krwASCZ1XegbfsPucae6U9E");
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("0000000048656c6c6f20576f726c642057697468205a65726f657321")));
}

TEST(Base58, decodes_base58_encoded_string_with_leading_or_trailing_spaces_to_bytes) {
    vector<uint8_t> res;

    res = Base58::Decode("    2NEpo7TZRRrLZSi2U");
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("48656c6c6f20576f726c6421")));

    res = Base58::Decode("  11117bo9qr42A5krwASCZ1XegbfsPucae6U9E             ");
    EXPECT_THAT(res, ElementsAreArray(Utils::Hex2Vec("0000000048656c6c6f20576f726c642057697468205a65726f657321")));
}

TEST(Base58, throws_on_invalid_base58_encoded_strings) {
    vector<uint8_t> res;

    EXPECT_THROW(Base58::Decode("  11117bo   9qr42A5krwASCZ1XegbfsPucae6U9E             "), invalid_argument);
    EXPECT_THROW(Base58::Decode("2NEpO7TZRRrLZSi2U"), invalid_argument);
    EXPECT_THROW(Base58::Decode("2NEpo7TZRRrIZSi2U"), invalid_argument);
    EXPECT_THROW(Base58::Decode("2NEpo7TZRRrLZSi20"), invalid_argument);
    EXPECT_THROW(Base58::Decode("lNEpo7TZRRrLZSi20"), invalid_argument);
    EXPECT_THROW(Base58::Decode("2NEpo+TZRRrLZSi2U"), invalid_argument);
    EXPECT_THROW(Base58::Decode("2NEpo7TZRRrL/Si2U"), invalid_argument);
}
