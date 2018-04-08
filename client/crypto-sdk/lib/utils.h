#pragma once

#include <cstdint>
#include <string>
#include <vector>

#include "exports.h"

namespace Orbs {

class CRYPTO_EXPORT Utils {
public:
    static const std::string Vec2Hex(const std::vector<uint8_t> &data);
    static const std::vector<uint8_t> Hex2Vec(const std::string &data);
};

}
