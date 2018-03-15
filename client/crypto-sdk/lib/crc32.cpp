#include "crc32.h"

#include <gcrypt.h>

#include "utils.h"

using namespace std;
using namespace Orbs;

void CRC32::Hash(const vector<uint8_t> &data, vector<uint8_t> &res) {
    size_t digestLength = gcry_md_get_algo_dlen(GCRY_MD_CRC32);
    res.resize(digestLength);

    gcry_md_hash_buffer(GCRY_MD_CRC32, &res[0], &data[0], data.size());
}

void CRC32::Hash(const vector<uint8_t> &data, string &res) {
    vector<uint8_t> binRes;

    CRC32::Hash(data, binRes);

    res = Utils::Vec2Hex(binRes);
}

void CRC32::Hash(const string &str, vector<uint8_t> &res) {
    vector<uint8_t> data(str.begin(), str.end());

    CRC32::Hash(data, res);
}

void CRC32::Hash(const string &str, string &res) {
    vector<uint8_t> binRes;

    CRC32::Hash(str, binRes);

    res = Utils::Vec2Hex(binRes);
}
