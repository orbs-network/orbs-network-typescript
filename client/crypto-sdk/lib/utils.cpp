#include "utils.h"

#include <iomanip>
#include <iostream>
#include <sstream>
#include <stdexcept>

using namespace std;
using namespace Orbs;

const string Utils::Vec2Hex(const vector<uint8_t> &data) {
    stringstream ss;
    ss << hex << setfill('0');
    for (uint8_t i : data) {
        ss << setw(2) << static_cast<unsigned>(i);
    }

    return ss.str();
}

static const string HEX_ALPHABET("0123456789abcdefABCDEF");

const vector<uint8_t> Utils::Hex2Vec(const string &data) {
    if (data.length() % 2 != 0) {
        throw invalid_argument("Invalid data length!");
    }

    if (data.find_first_not_of(HEX_ALPHABET) != string::npos) {
        throw invalid_argument("Invalid hex data!");
    }

    vector<uint8_t> res;
    res.reserve(data.length() / 2);
    for (string::size_type i = 0; i < data.length(); i += 2) {
        unsigned byte;
        istringstream strm(data.substr(i, 2));
        strm >> hex >> byte;
        res.push_back(static_cast<uint8_t>(byte));
    }

    return res;
}
