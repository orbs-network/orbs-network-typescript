#include "ripemd160.h"

#include <gcrypt.h>

#include "utils.h"

using namespace std;
using namespace Orbs;

void RIPEMD160::Hash(const vector<uint8_t> &data, vector<uint8_t> &res) {
    size_t digestLength = gcry_md_get_algo_dlen(GCRY_MD_RMD160);
    res.resize(digestLength);

    gcry_md_hash_buffer(GCRY_MD_RMD160, &res[0], &data[0], data.size());
}

void RIPEMD160::Hash(const vector<uint8_t> &data, string &res) {
    vector<uint8_t> binRes;

    RIPEMD160::Hash(data, binRes);

    res = Utils::Vec2Hex(binRes);
}

void RIPEMD160::Hash(const string &str, vector<uint8_t> &res) {
    vector<uint8_t> data(str.begin(), str.end());

    RIPEMD160::Hash(data, res);
}

void RIPEMD160::Hash(const string &str, string &res) {
    vector<uint8_t> binRes;

    RIPEMD160::Hash(str, binRes);

    res = Utils::Vec2Hex(binRes);
}
