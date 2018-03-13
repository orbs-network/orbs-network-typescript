#include "base58.h"

#include <algorithm>
#include <iterator>
#include <stdexcept>
#include <string>

#include <assert.h>

using namespace std;
using namespace Orbs;

// log(256) / log(58), rounded up.
static const float LOG256_OVER_LOG58 = 138.0f / 100;

// log(58) / log(256), rounded up.
static const float LOG58_OVER_LOG256 = 733.0f / 1000;

// All alphanumeric characters except for "0", "I", "O", and "l".
static const string BASE58_CHARACTERS("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

static const uint32_t B256 = 256;
static const uint32_t B58 = 58;
static const char WHITESPACE = ' ';
static const char ENCODED_ZERO = '1';

// Encode a byte vector to a base58 encoded string.
const string Base58::Encode(const vector<uint8_t> &data) {
    if (data.empty()) {
        return string();
    }

    // Skip and count leading zeroes.
    size_t zeroes = 0;
    for (uint8_t c : data) {
        if (c != 0) {
            break;
        }

        ++zeroes;
    }

    size_t size = (data.size() - zeroes) * LOG256_OVER_LOG58 + 1;
    vector<uint8_t> buf(size, 0);

    ssize_t i = 0;
    ssize_t j = 0;
    ssize_t high = 0;
    for (i = zeroes, high = size - 1; i < static_cast<ssize_t>(data.size()); ++i, high = j) {
        int carry;
		for (carry = data[i], j = size - 1; (j > high) || carry; --j) {
			carry += B256 * buf[j];
			buf[j] = carry % B58;
			carry /= B58;
		}

        assert(carry == 0);
	}

    for (j = 0; j < static_cast<ssize_t>(size) && !buf[j]; ++j);

    string str;
    str.reserve(size + zeroes);
    str.assign(zeroes, ENCODED_ZERO);

    for (i = zeroes; j < static_cast<ssize_t>(size); ++i, ++j) {
        str += BASE58_CHARACTERS[buf[j]];
    }

    return str;
}

// Decode a a base58 encoded strin to a byte vector.
const vector<uint8_t> Base58::Decode(const string &data) {
    // Skip leading and trailing spaces.
    string str;
    const size_t strBegin = data.find_first_not_of(WHITESPACE);
    if (strBegin != string::npos) {
        const size_t strEnd = data.find_last_not_of(WHITESPACE);
        str = data.substr(strBegin, strEnd - strBegin + 1);
    } else {
        str = data;
    }

    // Skip and count leading '1's.
    size_t zeroes = 0;
    for (char c : str) {
        if (c != ENCODED_ZERO) {
            break;
        }

        ++zeroes;
    }

    // Allocate enough space in big-endian base256 representation.
    size_t size = str.length() * LOG58_OVER_LOG256 + 1;
    vector<uint8_t> b256(size, 0);

    // Process the characters.
    int length = 0;
    for (char c : str) {
        // Decode base58 character
        const size_t ch = BASE58_CHARACTERS.find_first_of(c);
        if (ch == string::npos) {
            throw logic_error("Invalid character: " + to_string(c));
        }

        // Apply "b256 = b256 * 58 + ch".
        int carry = ch;
        int i = 0;
        for (vector<uint8_t>::reverse_iterator it = b256.rbegin(); (carry != 0 || i < length) && (it != b256.rend()); ++it, ++i) {
            carry += B58 * (*it);
            *it = carry % B256;
            carry /= B256;
        }

        assert(carry == 0);

        length = i;
    }

    // Skip leading zeroes in b256.
    vector<uint8_t>::iterator it = b256.begin() + (size - length);
    while (it != b256.end() && *it == 0) {
        it++;
    }

    // Copy result into output vector.
    vector<uint8_t> res;
    res.reserve(zeroes + (b256.end() - it));
    res.assign(zeroes, 0x00);
    while (it != b256.end()) {
        res.push_back(*(it++));
    }

    return res;
}
