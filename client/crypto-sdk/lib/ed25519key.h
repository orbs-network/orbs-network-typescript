#pragma once

#include <cstdint>
#include <string>
#include <vector>

#include "exports.h"

namespace Orbs {

typedef void *key_t;

class CRYPTO_EXPORT ED25519Key {
public:
    static const uint8_t PUBLIC_KEY_SIZE;
    static const uint8_t PRIVATE_KEY_SIZE;
    static const uint8_t SIGNATURE_SIZE;

    // Generates new public key pair using the ED25519 curve.
    explicit ED25519Key();

    // Imports existing public key.
    explicit ED25519Key(const std::vector<uint8_t> &publicKey);
    explicit ED25519Key(const std::string &publicKey);

    // Imports existing public and private key pair.
    explicit ED25519Key(const std::vector<uint8_t> &publicKey, const std::vector<uint8_t> &privateKey);
    explicit ED25519Key(const std::string &publicKey, const std::string &privateKey);

    virtual ~ED25519Key();

    // Exports the public key.
    virtual const std::vector<uint8_t> GetPublicKey() const;
    bool HasPrivateKey() const;

    // Returns the EdDSA signature, using SHA512 as the message digest.
    //
    // Note: the returned signature is the concatenation of R (32 bytes) with S (32 bytes).
    const std::vector<uint8_t> Sign(const std::vector<uint8_t> &message) const;

    // Verifies the EdDSA signature, using SHA512 as the message digest.
    //
    // Note: the signature is expected to be the concatenation of R (32 bytes) with S (32 bytes).
    bool Verify(const std::vector<uint8_t> &message, const std::vector<uint8_t> &signature) const;

    // Disable copy constructor, in order to prevent key_t dereferencing.
    ED25519Key(const ED25519Key &other) = delete;

private:
    void Init(const std::vector<uint8_t> &publicKey);
    void Init(const std::vector<uint8_t> &publicKey, const std::vector<uint8_t> &privateKey);

    // Verifies whether the public key pair is consistent and throws on error.
    void VerifyKeyPairConsistency() const;

    // Verifies whether the public key pair consists from related keys.
    void VerifyKeyPairRelation() const;

private:
    key_t key_ = nullptr;
    bool privateKey_ = false;
};

}
