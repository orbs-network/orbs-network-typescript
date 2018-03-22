#pragma once

#include <cstdint>
#include <string>
#include <vector>

#include "ed25519key.h"

namespace Orbs {

class Address {
public:
    static const uint8_t MAIN_NETWORK_ID;
    static const uint8_t TEST_NETWORK_ID;

    static const uint8_t VERSION;
    static const uint32_t PUBLIC_KEY_SIZE;
    static const uint32_t NETWORK_ID_SIZE;
    static const uint32_t VERSION_SIZE;
    static const uint32_t VIRTUAL_CHAIN_ID_SIZE;
    static const uint8_t VIRTUAL_CHAIN_ID_MSB;
    static const uint32_t ACCOUNT_ID_SIZE;
    static const uint32_t CHECKSUM_SIZE;
    static const uint32_t ADDRESS_LENGTH;

    explicit Address(const std::vector<uint8_t> &publicKey, const std::vector<uint8_t> &virtualChainId, uint8_t networkId);
    explicit Address(const std::string &publicKey, const std::string &virtualChainId, const std::string &networkId);

    explicit Address(const ED25519Key &key, const std::vector<uint8_t> &virtualChainId, uint8_t networkId);

    virtual ~Address();

    const std::vector<uint8_t> &GetPublicKey() const;
    uint8_t GetNetworkId() const;
    uint8_t GetVersion() const;
    const std::vector<uint8_t> &GetVirtualChainId() const;
    const std::vector<uint8_t> &GetAccountId() const;
    const std::vector<uint8_t> &GetChecksum() const;

    const std::string ToString() const;

    static bool IsValidNetworkId(uint8_t networkId);
    static bool IsValidVersion(uint8_t version);
    static bool IsValidVirtualChainId(const std::vector<uint8_t> &virtualChainId);
    static bool IsValid(const std::string &address);

private:
    void Init();

private:
    std::vector<uint8_t> publicKey_;
    std::vector<uint8_t> virtualChainId_;
    uint8_t networkId_;
    uint8_t version_;
    std::vector<uint8_t> accountId_;
    std::vector<uint8_t> checksum_;
};

}
