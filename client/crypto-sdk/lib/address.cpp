#include "address.h"

#include <stdexcept>
#include <algorithm>

#include <assert.h>

#include "base58.h"
#include "crc32.h"
#include "ripemd160.h"
#include "sha256.h"

using namespace std;
using namespace Orbs;

const uint8_t Address::VERSION = 0;
const uint32_t Address::PUBLIC_KEY_SIZE = 32;
const uint32_t Address::ACCOUNT_ID_SIZE = 20;
const uint32_t Address::CHECKSUM_SIZE = 4;
const uint32_t Address::ADDRESS_LENGTH = 34;

Address::Address(const vector<uint8_t> &publicKey) : publicKey_(publicKey) {
    if (publicKey_.size() != Address::PUBLIC_KEY_SIZE) {
        throw invalid_argument("Invalid public key length: " + to_string(publicKey_.size()));
    }

    // Initialize version to its current default.
    version_ = Address::VERSION;

    // Calculate the account ID by calculating the RIPEMD160 hash of the SHA256 of the public key.
    vector<uint8_t> sha256;
    SHA256::Hash(publicKey_, sha256);
    RIPEMD160::Hash(sha256, accountId_);

    assert(accountId_.size() == Address::ACCOUNT_ID_SIZE);

    // Calculate the CRC32 checksum of the concatenation of the version and the account ID.
    vector<uint8_t> versionedAccountId;
    versionedAccountId.push_back(version_);
    versionedAccountId.insert(versionedAccountId.end(), accountId_.cbegin(), accountId_.cend());
    CRC32::Hash(versionedAccountId, checksum_);

    assert(checksum_.size() == Address::CHECKSUM_SIZE);
}

Address::~Address() {
}

const vector<uint8_t> &Address::GetPublicKey() const {
    return publicKey_;
}

uint8_t Address::GetVersion() const {
    return version_;
}

const vector<uint8_t> &Address::GetAccountId() const {
    return accountId_;
}

const vector<uint8_t> &Address::GetChecksum() const {
    return checksum_;
}

const string Address::ToString() const {
    // Concatenate the version, the account ID, and the checksum together.
    vector<uint8_t> rawAddress;
    rawAddress.push_back(version_);
    rawAddress.insert(rawAddress.end(), accountId_.cbegin(), accountId_.cend());
    rawAddress.insert(rawAddress.end(), checksum_.cbegin(), checksum_.cend());

    // Return the BASE58 encoding of the raw address.
    return Base58::Encode(rawAddress);
}

bool Address::IsValid(const string &address) {
    if (address.length() != Address::ADDRESS_LENGTH) {
        return false;
    }

    vector<uint8_t> decoded;
    try {
        decoded = Base58::Decode(address);
    } catch (const logic_error &e) {
        return false;
    }

    // Version (1) + Account ID (20) + Checksum (4)
    if (decoded.size() != 1 + Address::ACCOUNT_ID_SIZE + Address::CHECKSUM_SIZE) {
        return false;
    }

    // Check the version (the first byte of the decoded address).
    uint8_t version = decoded[0];
    if (version != Address::VERSION) {
        return false;
    }

    // Check the checksum of the version + account ID:
    vector<uint8_t> data(decoded.cbegin(), decoded.cend() - Address::CHECKSUM_SIZE);
    vector<uint8_t> checksum(decoded.cend() - Address::CHECKSUM_SIZE, decoded.cend());
    vector<uint8_t> dataChecksum;
    CRC32::Hash(data, dataChecksum);
    if (checksum != dataChecksum) {
        return false;
    }

    return true;
}
