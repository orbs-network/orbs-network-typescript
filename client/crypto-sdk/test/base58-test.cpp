#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/base58.h"

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
    EXPECT_THAT(res, ElementsAreArray(vector<uint8_t>()));

    res = Base58::Decode("2NEpo7TZRRrLZSi2U");
    EXPECT_THAT(res, ElementsAreArray("\x48\x65\x6c\x6c\x6f\x20\x57\x6f\x72\x6c\x64\x21", 12));

    res = Base58::Decode("2vbj8nkKYpsGbfshRaXgGKCBo6qRf139grYSvdqv17RxMu2yHB8o1SUcpqV1fU6orCLcwVbQZY5o95u2mqf4M3tWL1TQhCQsRG5i1ydr5ot7CRJdM7Us49yJhHci1opQjmLuT");
    EXPECT_THAT(res, ElementsAreArray("\x49\x66\x20\x79\x6f\x75\x20\x64\x6f\x6e\x27\x74\x20\x62\x65\x6c\x69\x65\x76\x65\x20\x69\x74\x20\x6f\x72\x20\x64\x6f\x6e\x27\x74\x20\x67\x65"
        "\x74\x20\x69\x74\x20\x49\x20\x64\x6f\x6e\x27\x74\x20\x68\x61\x76\x65\x20\x74\x68\x65\x20\x74\x69\x6d\x65\x20\x74\x6f\x20\x74\x72\x79\x20\x74\x6f\x20\x63\x6f\x6e\x76\x69"
        "\x6e\x63\x65\x20\x79\x6f\x75\x2c\x20\x49\x20\x61\x6d\x20\x73\x6f\x72\x72\x79\x2e", 97));

    res = Base58::Decode("11117bo9qr42A5krwASCZ1XegbfsPucae6U9E");
    EXPECT_THAT(res, ElementsAreArray("\x00\x00\x00\x00\x48\x65\x6c\x6c\x6f\x20\x57\x6f\x72\x6c\x64\x20\x57\x69\x74\x68\x20\x5a\x65\x72\x6f\x65\x73\x21", 28));
}

TEST(Base58, decodes_base58_encoded_string_with_leading_or_trailing_spaces_to_bytes) {
    vector<uint8_t> res;

    res = Base58::Decode("    2NEpo7TZRRrLZSi2U");
    EXPECT_THAT(res, ElementsAreArray("\x48\x65\x6c\x6c\x6f\x20\x57\x6f\x72\x6c\x64\x21", 12));

    res = Base58::Decode("  11117bo9qr42A5krwASCZ1XegbfsPucae6U9E             ");
    EXPECT_THAT(res, ElementsAreArray("\x00\x00\x00\x00\x48\x65\x6c\x6c\x6f\x20\x57\x6f\x72\x6c\x64\x20\x57\x69\x74\x68\x20\x5a\x65\x72\x6f\x65\x73\x21", 28));
}

TEST(Base58, throws_on_invalid_base58_encoded_strings) {
    vector<uint8_t> res;

    EXPECT_THROW(Base58::Decode("  11117bo   9qr42A5krwASCZ1XegbfsPucae6U9E             "), runtime_error);
    EXPECT_THROW(Base58::Decode("2NEpO7TZRRrLZSi2U"), runtime_error);
    EXPECT_THROW(Base58::Decode("2NEpo7TZRRrIZSi2U"), runtime_error);
    EXPECT_THROW(Base58::Decode("2NEpo7TZRRrLZSi20"), runtime_error);
    EXPECT_THROW(Base58::Decode("lNEpo7TZRRrLZSi20"), runtime_error);
    EXPECT_THROW(Base58::Decode("2NEpo+TZRRrLZSi2U"), runtime_error);
    EXPECT_THROW(Base58::Decode("2NEpo7TZRRrL/Si2U"), runtime_error);
}
