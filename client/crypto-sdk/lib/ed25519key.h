#pragma once

#include <cstdint>
#include <vector>

#include <gcrypt.h>

namespace Orbs {

class ED25519Key {
public:
    static const uint32_t PUBLIC_KEY_SIZE;

    // Generates new public key pair using the ED25519 curve.
    explicit ED25519Key();
    explicit ED25519Key(const std::vector<uint8_t> &publicKey);
    virtual ~ED25519Key();

    // Exports the public key.
    virtual const std::vector<uint8_t> GetPublicKey() const;

    // Disable copy constructor, in order to prevent gcry_sexp_t dereferencing.
    ED25519Key(const ED25519Key &other) = delete;

private:
    // Verifies public key pair and throws on error.
    static void VerifyKeyPair(gcry_sexp_t key);

private:
    gcry_sexp_t key_;
};

}
