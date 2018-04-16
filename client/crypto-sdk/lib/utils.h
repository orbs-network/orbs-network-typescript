#pragma once

#include <cstdint>
#include <string>
#include <sstream>
#include <vector>

#include "exports.h"

namespace Orbs {

class CRYPTO_EXPORT Utils {
public:
    static const std::string Vec2Hex(const std::vector<uint8_t> &data);
    static const std::vector<uint8_t> Hex2Vec(const std::string &data);

    template <typename T>
    static const std::string ToString(T value) {
        std::ostringstream os;
        os << value;

        return os.str() ;
    }

    template <typename T>
    static const T FromString(const std::string &str) {
        std::stringstream s(str);

        T value;
        s >> value;

        return value;
    }
};

}
