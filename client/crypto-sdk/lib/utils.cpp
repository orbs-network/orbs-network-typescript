#include "utils.h"

#include <iomanip>
#include <iostream>
#include <sstream>

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
