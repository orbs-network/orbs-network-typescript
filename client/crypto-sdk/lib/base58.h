#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace Orbs {

class Base58 {
public:
    // Encode a byte vector to a base58 encoded string.
    static const std::string Encode(const std::vector<uint8_t> &data);

    // Decode a a base58 encoded strin to a byte vector.
    static const std::vector<uint8_t> Decode(const std::string &data);
};

}
