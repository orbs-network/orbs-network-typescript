#include "ed25519key.h"

#include <stdexcept>

#include <gcrypt.h>

#include "crypto.h"
#include "utils.h"

using namespace std;
using namespace Orbs;

struct key {
    gcry_sexp_t key;
};

const uint8_t ED25519Key::PUBLIC_KEY_SIZE = 32;
const uint8_t ED25519Key::PRIVATE_KEY_SIZE = 64;

static const string ED25519_GENKEY =
    "(genkey"
        "(ecc"
            "(curve Ed25519)"
            "(flags param eddsa)"
        ")"
    ")";

static const string ED25519_IMPORT_PUBLIC_KEY =
    "(public-key"
        "(ecc"
            "(curve Ed25519)"
            "(flags eddsa)"
            "(q %b)"
        ")"
    ")";

// Generates new public key pair using the ED25519 curve.
ED25519Key::ED25519Key() {
    key_ = new gcry_sexp_t();

    gcry_sexp_t parms = nullptr;

    try {
        gcry_error_t err = gcry_sexp_build(&parms, nullptr, ED25519_GENKEY.c_str());
        if (err) {
            throw runtime_error("gcry_sexp_build failed with: " + string(gcry_strerror(err)));
        }

        err = gcry_pk_genkey(static_cast<gcry_sexp_t *>(key_), parms);
        if (err) {
            throw runtime_error("gcry_pk_genkey failed with: " + string(gcry_strerror(err)));
        }

        // Check that the generated key is valid.
        VerifyKeyPair(key_);
        privateKey_ = true;
    } catch (...) {
        gcry_sexp_release(parms);

        throw;
    }

    gcry_sexp_release(parms);
}

ED25519Key::ED25519Key(const vector<uint8_t> &publicKey) {
    Init(publicKey);
}

ED25519Key::ED25519Key(const string &publicKey) {
    Init(Utils::Hex2Vec(publicKey));
}

ED25519Key::ED25519Key(const vector<uint8_t> &publicKey, const vector<uint8_t> &privateKey) {
    Init(publicKey, privateKey);
}

ED25519Key::ED25519Key(const string &publicKey, const string &privateKey) {
    Init(Utils::Hex2Vec(publicKey), Utils::Hex2Vec(privateKey));
}

void ED25519Key::Init(const vector<uint8_t> &publicKey) {
    if (publicKey.size() != ED25519Key::PUBLIC_KEY_SIZE) {
        throw invalid_argument("Invalid public key length: " + Utils::ToString(publicKey.size()));
    }

    key_ = new gcry_sexp_t();
    gcry_error_t err = gcry_sexp_build(static_cast<gcry_sexp_t *>(key_), nullptr, ED25519_IMPORT_PUBLIC_KEY.c_str(), publicKey.size(), &publicKey[0]);
    if (err) {
        throw runtime_error("gcry_sexp_build failed with: " + string(gcry_strerror(err)));
    }
}

void ED25519Key::Init(const vector<uint8_t> &publicKey, const vector<uint8_t> &privateKey) {
    if (publicKey.size() != ED25519Key::PUBLIC_KEY_SIZE) {
        throw invalid_argument("Invalid public key length: " + Utils::ToString(publicKey.size()));
    }

    if (privateKey.size() != ED25519Key::PRIVATE_KEY_SIZE) {
        throw invalid_argument("Invalid public key length: " + Utils::ToString(privateKey.size()));
    }
}

ED25519Key::~ED25519Key() {
    if (key_ != nullptr) {
        gcry_sexp_t *gkey = static_cast<gcry_sexp_t *>(key_);
        gcry_sexp_release(*gkey);

        delete gkey;
    }

    key_ = nullptr;
}

// Verifies public key pair and throws on error.
void ED25519Key::VerifyKeyPair(key_t key) {
    if (key == nullptr || static_cast<void *>(key) == nullptr) {
        throw invalid_argument("Invalid key!");
    }

    gcry_sexp_t gkey = *static_cast<gcry_sexp_t *>(key);

    gcry_sexp_t publicKey = nullptr;
    gcry_sexp_t secretKey = nullptr;

    try {
        publicKey = gcry_sexp_find_token(gkey, "public-key", 0);
        if (!publicKey) {
            throw invalid_argument("Public part is missing!");
        }

        secretKey = gcry_sexp_find_token(gkey, "private-key", 0);
        if (!secretKey) {
            throw invalid_argument("Private part is missing!");
        }

        gcry_error_t err = gcry_pk_testkey(secretKey);
        if (err) {
            throw invalid_argument("gcry_pk_testkey failed with: " + string(gcry_strerror(err)));
        }

        // Check that gcry_pk_testkey also works on the entire S-expression.
        err = gcry_pk_testkey(gkey);
        if (err) {
            throw invalid_argument("gcry_pk_testkey failed on the entire key with: " + string(gcry_strerror(err)));
        }
    } catch (...) {
        gcry_sexp_release(publicKey);
        gcry_sexp_release(secretKey);

        throw;
    }

    gcry_sexp_release(publicKey);
    gcry_sexp_release(secretKey);
}

// Exports the public key.
const vector<uint8_t> ED25519Key::GetPublicKey() const {
    vector<uint8_t> res;
    gcry_sexp_t publicKey = nullptr;
    gcry_sexp_t qPoint = nullptr;

    try {
        gcry_sexp_t gkey = *static_cast<gcry_sexp_t *>(key_);
        publicKey = gcry_sexp_find_token(gkey, "public-key", 0);
        if (!publicKey) {
            throw runtime_error("gcry_sexp_find_token failed to find \"public-key\"!");
        }

        // Extract the Q ECC param. In ECC, the q-point represents the public key Q = dG.
        qPoint = gcry_sexp_find_token(publicKey, "q", 0);
        if (!qPoint) {
            throw runtime_error("gcry_sexp_find_token failed to find \"q\"!");
        }

        size_t length;
        char *value = reinterpret_cast<char *>(gcry_sexp_nth_buffer(qPoint, 1, &length));
        if (!value) {
            throw runtime_error("gcry_sexp_nth_buffer failed!");
        }

        res = vector<uint8_t>(value, value + length);
        gcry_free(value);
    } catch (...) {
        gcry_sexp_release(qPoint);
        gcry_sexp_release(publicKey);

        throw;
    }

    gcry_sexp_release(qPoint);
    gcry_sexp_release(publicKey);

    return res;
}

bool ED25519Key::HasPrivateKey() const {
    return privateKey_;
}
