#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace Orbs {

class Hash {
public:
    static void SHA256(const std::vector<uint8_t> &data, std::vector<uint8_t> &res);
    static void SHA256(const std::vector<uint8_t> &data, std::string &res);
    static void SHA256(const std::string &str, std::vector<uint8_t> &res);
    static void SHA256(const std::string &str, std::string &res);

    static void RIPEMD160(const std::vector<uint8_t> &data, std::vector<uint8_t> &res);
    static void RIPEMD160(const std::vector<uint8_t> &data, std::string &res);
    static void RIPEMD160(const std::string &str, std::vector<uint8_t> &res);
    static void RIPEMD160(const std::string &str, std::string &res);
};

}
