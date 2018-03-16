#pragma once

#include <string>
#include <vector>

namespace Orbs {

class Address {
public:
    static const uint8_t VERSION;
    static const uint32_t PUBLIC_KEY_SIZE;
    static const uint32_t ACCOUNT_ID_SIZE;
    static const uint32_t CHECKSUM_SIZE;
    static const uint32_t ADDRESS_LENGTH;

    Address(const std::vector<uint8_t> &publicKey);
    Address(const std::string &publicKey);
    virtual ~Address();

    const std::vector<uint8_t> &GetPublicKey() const;
    uint8_t GetVersion() const;
    const std::vector<uint8_t> &GetAccountId() const;
    const std::vector<uint8_t> &GetChecksum() const;

    const std::string ToString() const;

    static bool IsValid(const std::string &address);

private:
    void Init();

private:
    std::vector<uint8_t> publicKey_;
    uint8_t version_;
    std::vector<uint8_t> accountId_;
    std::vector<uint8_t> checksum_;
};

}
