#include "address.h"

#include <stdexcept>
#include <algorithm>
#include <sstream>

#include <assert.h>

#include "base58.h"
#include "crc32.h"
#include "ripemd160.h"
#include "sha256.h"
#include "utils.h"

using namespace std;
using namespace Orbs;

const uint8_t Address::MAIN_NETWORK_ID = 0x14; // "M" in BASE58.
const uint8_t Address::TEST_NETWORK_ID = 0x1A; // "T" in BASE58;

const uint8_t Address::VERSION = 0;
const uint32_t Address::PUBLIC_KEY_SIZE = 32;
const uint32_t Address::NETWORK_ID_SIZE = 1;
const uint32_t Address::VERSION_SIZE = 1;
const uint32_t Address::VIRTUAL_CHAIN_ID_SIZE = 3;
const uint8_t Address::VIRTUAL_CHAIN_ID_MSB = 0x08;
const uint32_t Address::ACCOUNT_ID_SIZE = 20;
const uint32_t Address::CHECKSUM_SIZE = 4;
const uint32_t Address::ADDRESS_LENGTH = 39;

Address::Address(const vector<uint8_t> &publicKey, const vector<uint8_t> &virtualChainId, uint8_t networkId) :
    publicKey_(publicKey), virtualChainId_(virtualChainId), networkId_(networkId) {

    Init();
}

Address::Address(const string &publicKey, const string &virtualChainId, const std::string &networkId) :
    publicKey_(Utils::Hex2Vec(publicKey)), virtualChainId_(Utils::Hex2Vec(virtualChainId))  {

    vector<uint8_t> decodedNetworkId = Base58::Decode(networkId);
    if (decodedNetworkId.size() != NETWORK_ID_SIZE || !IsValidNetworkId(decodedNetworkId[0])) {
        throw invalid_argument("Invalid network ID: " + networkId);
    }

    networkId_ = decodedNetworkId[0];

    Init();
}

Address::Address(const ED25519Key &key, const vector<uint8_t> &virtualChainId, uint8_t networkId) :
    publicKey_(key.GetPublicKey()), virtualChainId_(virtualChainId), networkId_(networkId) {

    Init();
}

void Address::Init() {
    if (publicKey_.size() != Address::PUBLIC_KEY_SIZE) {
        throw invalid_argument("Invalid public key length: " + to_string(publicKey_.size()));
    }

    if (!IsValidVirtualChainId(virtualChainId_)) {
        throw invalid_argument("Invalid virtual chain ID: " + Utils::Vec2Hex(virtualChainId_));
    }

    if (!IsValidNetworkId(networkId_)) {
        throw invalid_argument("Invalid network ID: " + to_string(networkId_));
    }

    // Initialize version to its current default.
    version_ = Address::VERSION;

    // Calculate the account ID by calculating the RIPEMD160 hash of the SHA256 of the public key.
    vector<uint8_t> sha256;
    SHA256::Hash(publicKey_, sha256);
    RIPEMD160::Hash(sha256, accountId_);

    assert(accountId_.size() == Address::ACCOUNT_ID_SIZE);

    // Calculate the CRC32 checksum of the concatenation of the network ID, version, virtual chadin ID, and the account ID.
    vector<uint8_t> prefixedAccountId;
    prefixedAccountId.push_back(networkId_);
    prefixedAccountId.push_back(version_);
    prefixedAccountId.insert(prefixedAccountId.end(), virtualChainId_.cbegin(), virtualChainId_.cend());
    prefixedAccountId.insert(prefixedAccountId.end(), accountId_.cbegin(), accountId_.cend());
    CRC32::Hash(prefixedAccountId, checksum_);

    assert(checksum_.size() == Address::CHECKSUM_SIZE);
}

Address::~Address() {
}

const vector<uint8_t> &Address::GetPublicKey() const {
    return publicKey_;
}

uint8_t Address::GetNetworkId() const {
    return networkId_;
}

uint8_t Address::GetVersion() const {
    return version_;
}

const vector<uint8_t> &Address::GetVirtualChainId() const {
    return virtualChainId_;
}

const vector<uint8_t> &Address::GetAccountId() const {
    return accountId_;
}

const vector<uint8_t> &Address::GetChecksum() const {
    return checksum_;
}

const string Address::ToString() const {
    stringstream str;

    // BASE58 encode the network ID and append it to the result.
    vector<uint8_t> networkIdData;
    networkIdData.push_back(networkId_);
    str << Base58::Encode(networkIdData);

    // BASE58 decode the version and append it to the result.
    vector<uint8_t> versionData;
    versionData.push_back(version_);
    str << Base58::Encode(versionData);

    // Concatenate the virtual chain ID, the account ID, and the checksum together.
    vector<uint8_t> rawAddress;
    rawAddress.insert(rawAddress.end(), virtualChainId_.cbegin(), virtualChainId_.cend());
    rawAddress.insert(rawAddress.end(), accountId_.cbegin(), accountId_.cend());
    rawAddress.insert(rawAddress.end(), checksum_.cbegin(), checksum_.cend());
    str << Base58::Encode(rawAddress);

    return str.str();
}

bool Address::IsValidNetworkId(uint8_t networkId) {
    return Address::MAIN_NETWORK_ID == networkId || Address::TEST_NETWORK_ID == networkId;
}

bool Address::IsValidVersion(uint8_t version) {
    return 0 == version;
}

bool Address::IsValidVirtualChainId(const vector<uint8_t> &virtualChainId) {
    return virtualChainId.size() == Address::VIRTUAL_CHAIN_ID_SIZE && virtualChainId[0] >= Address::VIRTUAL_CHAIN_ID_MSB;
}

bool Address::IsValid(const string &address) {
    // log(256) / log(58), rounded up. Used to calculate the length of the data that was encoded using BASE58.
    static const float LOG256_OVER_LOG58 = 138.0f / 100;

    if (address.length() != Address::ADDRESS_LENGTH) {
        return false;
    }

    // Decode the network ID separately.
    vector<uint8_t> decoded;
    uint32_t offset = 0;
    try {
        uint32_t size = Address::NETWORK_ID_SIZE * LOG256_OVER_LOG58;
        decoded = Base58::Decode(address.substr(offset, size));
        offset += size;
    } catch (const logic_error &e) {
        return false;
    }

    if (decoded.size() != NETWORK_ID_SIZE || !IsValidNetworkId(decoded[0])) {
        return false;
    }

    uint8_t networkId = decoded[0];

    // Decode the version separately.
    try {
        uint32_t size = Address::VERSION_SIZE * LOG256_OVER_LOG58;
        decoded = Base58::Decode(address.substr(offset, size));
        offset += size;
    } catch (const logic_error &e) {
        return false;
    }

    if (decoded.size() != VERSION_SIZE || !IsValidVersion(decoded[0])) {
        return false;
    }

    uint8_t version = decoded[0];

    // Decode the remaining fields.
    try {
        uint32_t size = address.length() - offset;
        decoded = Base58::Decode(address.substr(offset, size));
        offset += size;
    } catch (const logic_error &e) {
        return false;
    }

    // Virtual Chain ID (6) + Account ID (20) + Checksum (4)
    if (decoded.size() != Address::VIRTUAL_CHAIN_ID_SIZE + Address::ACCOUNT_ID_SIZE + Address::CHECKSUM_SIZE) {
        return false;
    }

    // Verify the virtual chain ID.
    vector<uint8_t> virtualChainId(decoded.cbegin(), decoded.cbegin() + Address::VIRTUAL_CHAIN_ID_SIZE);
    if (!IsValidVirtualChainId(virtualChainId)) {
        return false;
    }

    // Check the checksum whole raw address (including the network ID and the version).
    vector<uint8_t> rawAddress;
    rawAddress.push_back(networkId);
    rawAddress.push_back(version);
    rawAddress.insert(rawAddress.cend(), decoded.cbegin(), decoded.cend() - Address::CHECKSUM_SIZE);

    vector<uint8_t> checksum(decoded.cend() - Address::CHECKSUM_SIZE, decoded.cend());
    vector<uint8_t> dataChecksum;
    CRC32::Hash(rawAddress, dataChecksum);
    if (checksum != dataChecksum) {
        return false;
    }

    return true;
}
