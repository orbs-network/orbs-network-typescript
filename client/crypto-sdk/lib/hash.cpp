#include "hash.h"

#include <exception>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <sodium.h>

using namespace std;
using namespace Orbs;

static const string vec2hex(const vector<uint8_t> &data) {
    stringstream ss;
    ss << hex << setfill('0');
    for (uint8_t i : data) {
        ss << setw(2) << static_cast<unsigned>(i);
    }

    return ss.str();
}

void Hash::SHA256(const vector<uint8_t> &data, vector<uint8_t> &res) {
    res.clear();

    unsigned char out[crypto_hash_sha256_BYTES];
    if (crypto_hash_sha256(out, &data[0], data.size())) {
        throw runtime_error("crypto_hash_sha256 failed!");
    }

    res.insert(res.end(), out, out + sizeof(out));
}

void Hash::SHA256(const vector<uint8_t> &data, string &res) {
    vector<uint8_t> binRes;

    Hash::SHA256(data, binRes);

    res = vec2hex(binRes);
}

void Hash::SHA256(const string &str, vector<uint8_t> &res) {
    vector<uint8_t> data(str.begin(), str.end());

    Hash::SHA256(data, res);
}

void Hash::SHA256(const string &str, string &res) {
    vector<uint8_t> binRes;

    Hash::SHA256(str, binRes);

    res = vec2hex(binRes);
}
