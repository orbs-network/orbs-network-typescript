#include "hash.h"

#include <gcrypt.h>

#include <iomanip>
#include <iostream>
#include <sstream>

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
    size_t digestLength = gcry_md_get_algo_dlen(GCRY_MD_SHA256);
    res.resize(digestLength);

    gcry_md_hash_buffer(GCRY_MD_SHA256, &res[0], &data[0], data.size());
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

void Hash::RIPEMD160(const vector<uint8_t> &data, vector<uint8_t> &res) {
    size_t digestLength = gcry_md_get_algo_dlen(GCRY_MD_RMD160);
    res.resize(digestLength);

    gcry_md_hash_buffer(GCRY_MD_RMD160, &res[0], &data[0], data.size());
}

void Hash::RIPEMD160(const vector<uint8_t> &data, string &res) {
    vector<uint8_t> binRes;

    Hash::RIPEMD160(data, binRes);

    res = vec2hex(binRes);
}

void Hash::RIPEMD160(const string &str, vector<uint8_t> &res) {
    vector<uint8_t> data(str.begin(), str.end());

    Hash::RIPEMD160(data, res);
}

void Hash::RIPEMD160(const string &str, string &res) {
    vector<uint8_t> binRes;

    Hash::RIPEMD160(str, binRes);

    res = vec2hex(binRes);
}
