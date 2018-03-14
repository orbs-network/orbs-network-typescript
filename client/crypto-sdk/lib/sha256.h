#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace Orbs {

class SHA256 {
public:
    static void Hash(const std::vector<uint8_t> &data, std::vector<uint8_t> &res);
    static void Hash(const std::vector<uint8_t> &data, std::string &res);
    static void Hash(const std::string &str, std::vector<uint8_t> &res);
    static void Hash(const std::string &str, std::string &res);
};

}
