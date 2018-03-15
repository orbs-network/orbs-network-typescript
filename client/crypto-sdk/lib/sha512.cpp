#include "sha512.h"

#include <gcrypt.h>

#include "utils.h"

using namespace std;
using namespace Orbs;

void SHA512::Hash(const vector<uint8_t> &data, vector<uint8_t> &res) {
    size_t digestLength = gcry_md_get_algo_dlen(GCRY_MD_SHA512);
    res.resize(digestLength);

    gcry_md_hash_buffer(GCRY_MD_SHA512, &res[0], &data[0], data.size());
}

void SHA512::Hash(const vector<uint8_t> &data, string &res) {
    vector<uint8_t> binRes;

    SHA512::Hash(data, binRes);

    res = Utils::Vec2Hex(binRes);
}

void SHA512::Hash(const string &str, vector<uint8_t> &res) {
    vector<uint8_t> data(str.begin(), str.end());

    SHA512::Hash(data, res);
}

void SHA512::Hash(const string &str, string &res) {
    vector<uint8_t> binRes;

    SHA512::Hash(str, binRes);

    res = Utils::Vec2Hex(binRes);
}
