#include "ed25519key.h"

#include <string>
#include <sstream>

#include "crypto.h"
#include "utils.h"

using namespace std;
using namespace Orbs;

const uint32_t ED25519Key::PUBLIC_KEY_SIZE = 32;

static const string ED25519_GENKEY =
    "(genkey"
        "(ecc"
            "(curve ֿEd25519)"
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
ED25519Key::ED25519Key() : key_(nullptr) {
    if (CryptoSDK::isFIPSMode()) {
        throw runtime_error("ED25519Key is currently not suppored in FIPS mode!");
    }

    gcry_sexp_t parms = nullptr;

    try {
        gcry_error_t err = gcry_sexp_build(&parms, NULL, ED25519_GENKEY.c_str());
        if (err) {
            throw runtime_error("gcry_sexp_build failed with: " + string(gcry_strerror(err)));
        }

        err = gcry_pk_genkey(&key_, parms);
        if (err) {
            throw runtime_error("gcry_pk_genkey failed with: " + string(gcry_strerror(err)));
        }

        // Check that the generated key is valid.
        VerifyKeyPair(key_);
    } catch (...) {
        gcry_sexp_release(parms);

        throw;
    }

    gcry_sexp_release(parms);
}

ED25519Key::ED25519Key(const vector<uint8_t> &publicKey) : key_(nullptr) {
    if (CryptoSDK::isFIPSMode()) {
        throw runtime_error("ED25519Key is currently not suppored in FIPS mode!");
    }

    if (publicKey.size() != ED25519Key::PUBLIC_KEY_SIZE) {
        throw invalid_argument("Invalid public key length: " + to_string(publicKey.size()));
    }

    gcry_error_t err = gcry_sexp_build(&key_, NULL, ED25519_IMPORT_PUBLIC_KEY.c_str(), publicKey.size(), &publicKey[0]);
    if (err) {
        throw runtime_error("gcry_sexp_build failed with: " + string(gcry_strerror(err)));
    }
}

ED25519Key::~ED25519Key() {
    gcry_sexp_release(key_);
    key_ = nullptr;
}

// Verifies public key pair and throws on error.
void ED25519Key::VerifyKeyPair(gcry_sexp_t key) {
    if (key == nullptr) {
        throw invalid_argument("Invalid key!");
    }

    gcry_sexp_t publicKey = nullptr;
    gcry_sexp_t secretKey = nullptr;

    try {
        publicKey = gcry_sexp_find_token(key, "public-key", 0);
        if (!publicKey) {
            throw invalid_argument("Public part is missing!");
        }

        secretKey = gcry_sexp_find_token(key, "private-key", 0);
        if (!secretKey) {
            throw invalid_argument("Private part is missing!");
        }

        gcry_error_t err = gcry_pk_testkey(secretKey);
        if (err) {
            throw invalid_argument("gcry_pk_testkey failed with: " + string(gcry_strerror(err)));
        }

        // Check that gcry_pk_testkey also works on the entire S-expression.
        err = gcry_pk_testkey(key);
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
        publicKey = gcry_sexp_find_token(key_, "public-key", 0);
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
