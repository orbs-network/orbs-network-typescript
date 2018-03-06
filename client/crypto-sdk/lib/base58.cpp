#include "base58.h"

#include <algorithm>
#include <iterator>

#include <assert.h>

using namespace std;
using namespace Orbs;

// log(256) / log(58), rounded up.
static const float LOG256_OVER_LOG58 = 138.0f / 100;

// All alphanumeric characters except for "0", "I", "O", and "l".
static const char* BASE58_CHARACTERS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// Encode a byte vector to a base58 encoded string.
const string Base58::Encode(const vector<uint8_t> &data) {
    if (data.empty()) {
        return string();
    }

    // Skip & count leading zeroes.
    size_t zeroes = 0;
    for (uint8_t c : data) {
        if (c != 0) {
            break;
        }

        zeroes++;
    }

    size_t size = (data.size() - zeroes) * LOG256_OVER_LOG58 + 1;
    vector<uint8_t> buf(size, 0);

    ssize_t i = 0;
    ssize_t j = 0;
    ssize_t high = 0;
    for (i = zeroes, high = size - 1; i < data.size(); ++i, high = j) {
        int carry;
		for (carry = data[i], j = size - 1; (j > high) || carry; --j) {
			carry += 256 * buf[j];
			buf[j] = carry % 58;
			carry /= 58;
		}
	}

    for (j = 0; j < size && !buf[j]; ++j);

    string str;
    str.reserve(size + zeroes);
    str.assign(zeroes, '1');

    for (i = zeroes; j < size; ++i, ++j) {
        str += BASE58_CHARACTERS[buf[j]];
    }

    return str;
}

// Decode a a base58 encoded strin to a byte vector.
const vector<uint8_t> Base58::Decode(const string &data) {
    return vector<uint8_t>();
}
