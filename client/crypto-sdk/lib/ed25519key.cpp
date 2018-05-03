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

static const uint8_t R_SIZE = 32;
static const uint8_t S_SIZE = 32;

const uint8_t ED25519Key::PUBLIC_KEY_SIZE = 32;
const uint8_t ED25519Key::PRIVATE_KEY_SIZE = 32;
const uint8_t ED25519Key::SIGNATURE_SIZE = R_SIZE + S_SIZE;

static const string ED25519_GENKEY(
    "(genkey"
        "(ecc"
            "(curve Ed25519)"
            "(flags param eddsa)"
        ")"
    ")"
);

static const string ED25519_IMPORT_PUBLIC_KEY(
    "(public-key"
        "(ecc"
            "(curve Ed25519)"
            "(flags eddsa)"
            "(q %b)"
        ")"
    ")"
);

static const string ED25519_IMPORT_PRIVATE_KEY(
    "(private-key"
        "(ecc"
            "(curve Ed25519)"
            "(flags eddsa)"
            "(q %b)"
            "(d %b)"
        ")"
    ")"
);

static const string ED25519_SIGN_DATA(
    "(data"
        "(flags eddsa)"
        "(hash-algo %s)"
        "(value %b)"
    ")"
);

static const string ED25519_VERIFY_DATA(
    "(sig-val"
       "(eddsa"
            "(r %b)"
            "(s %b)"
        ")"
    ")"
);

static const string PRIVATE_KEY_TOKEN("private-key");
static const string PUBLIC_KEY_TOKEN("public-key");
static const string SIG_VAL_TOKEN("sig-val");
static const string EDDSA_TOKEN("eddsa");
static const string R_TOKEN("r");
static const string S_TOKEN("s");
static const string SHA512("sha512");

// The number of random bytes we'd use for internal signature verification.
static const uint8_t TEST_RANDOM_BYTES = 32;

static const string SEXPToString(gcry_sexp_t value) {
  size_t size = gcry_sexp_sprint(value, GCRYSEXP_FMT_ADVANCED, NULL, 0);
  char buf[size];

  (void)gcry_sexp_sprint(value, GCRYSEXP_FMT_ADVANCED, buf, size);

  return string(buf);
}

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

        privateKey_ = true;

        // Check that the generated key is valid.
        VerifyKeyPairConsistency();
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
    gcry_error_t err = gcry_sexp_build(static_cast<gcry_sexp_t *>(key_), nullptr, ED25519_IMPORT_PUBLIC_KEY.c_str(),
        publicKey.size(), &publicKey[0]);
    if (err) {
        throw runtime_error("gcry_sexp_build failed with: " + string(gcry_strerror(err)));
    }
}

void ED25519Key::Init(const vector<uint8_t> &publicKey, const vector<uint8_t> &privateKey) {
    if (publicKey.size() != ED25519Key::PUBLIC_KEY_SIZE) {
        throw invalid_argument("Invalid public key length: " + Utils::ToString(publicKey.size()));
    }

    if (privateKey.size() != ED25519Key::PRIVATE_KEY_SIZE) {
        throw invalid_argument("Invalid private key length: " + Utils::ToString(privateKey.size()));
    }

    key_ = new gcry_sexp_t();
    gcry_error_t err = gcry_sexp_build(static_cast<gcry_sexp_t *>(key_), nullptr, ED25519_IMPORT_PRIVATE_KEY.c_str(),
        publicKey.size(), &publicKey[0], privateKey.size(), &privateKey[0]);
    if (err) {
        throw runtime_error("gcry_sexp_build failed with: " + string(gcry_strerror(err)));
    }

    privateKey_ = true;

    // Test if the keys are compatible.
    VerifyKeyPairRelation();
}

ED25519Key::~ED25519Key() {
    if (key_ != nullptr) {
        gcry_sexp_t *gkey = static_cast<gcry_sexp_t *>(key_);
        gcry_sexp_release(*gkey);

        delete gkey;
    }

    key_ = nullptr;
}

// Verifies whether the public key pair is consistent and throws on error.
void ED25519Key::VerifyKeyPairConsistency() const {
    if (key_ == nullptr || static_cast<void *>(key_) == nullptr) {
        throw invalid_argument("Invalid key!");
    }

    gcry_sexp_t gkey = *static_cast<gcry_sexp_t *>(key_);

    gcry_sexp_t publicKey = nullptr;
    gcry_sexp_t secretKey = nullptr;

    try {
        publicKey = gcry_sexp_find_token(gkey, PUBLIC_KEY_TOKEN.c_str(), 0);
        if (!publicKey) {
            throw invalid_argument("Public part is missing!");
        }

        secretKey = gcry_sexp_find_token(gkey, PRIVATE_KEY_TOKEN.c_str(), 0);
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

// Verifies whether the public key pair consits from related keys.
void ED25519Key::VerifyKeyPairRelation() const {
    if (key_ == nullptr || static_cast<void *>(key_) == nullptr) {
        throw invalid_argument("Invalid key!");
    }

    char *randomBuffer = nullptr;

    try {
        randomBuffer = reinterpret_cast<char *>(gcry_random_bytes(TEST_RANDOM_BYTES, GCRY_STRONG_RANDOM));
        if (!randomBuffer) {
            throw runtime_error("gcry_random_bytes has failed!");
        }

        vector<uint8_t> buffer;
        buffer.assign(randomBuffer, randomBuffer + TEST_RANDOM_BYTES);
        vector<uint8_t> signature(Sign(buffer));
        if (!Verify(buffer, signature)) {
            throw invalid_argument("Signature verification failed!");
        }
    } catch (...) {
        gcry_free(randomBuffer);

        throw;
    }

    gcry_free(randomBuffer);
}

// Exports the public key.
const vector<uint8_t> ED25519Key::GetPublicKey() const {
    vector<uint8_t> res;
    gcry_sexp_t key = nullptr;
    gcry_sexp_t qPoint = nullptr;

    try {
        gcry_sexp_t gkey = *static_cast<gcry_sexp_t *>(key_);
        const string token(privateKey_ ? PRIVATE_KEY_TOKEN : PUBLIC_KEY_TOKEN);
        key = gcry_sexp_find_token(gkey, token.c_str(), 0);
        if (!key) {
            throw runtime_error("gcry_sexp_find_token failed to find \"" + token + "\"!");
        }

        // Extract the Q ECC param. In ECC, the q-point represents the public key Q = dG.
        qPoint = gcry_sexp_find_token(key, "q", 0);
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
        gcry_sexp_release(key);

        throw;
    }

    gcry_sexp_release(qPoint);
    gcry_sexp_release(key);

    return res;
}

bool ED25519Key::HasPrivateKey() const {
    return privateKey_;
}

const vector<uint8_t> ED25519Key::Sign(const vector<uint8_t> &message) const {
    if (message.empty()) {
        throw new invalid_argument("Invalid message!");
    }

    if (!privateKey_) {
        throw new logic_error("Private key is missing!");
    }

    gcry_sexp_t msg = nullptr;
    gcry_sexp_t sig = nullptr;
    gcry_sexp_t tmp = nullptr;
    gcry_sexp_t tmp2 = nullptr;

    vector<uint8_t> res;

    try {
        gcry_error_t err = gcry_sexp_build(&msg, nullptr, ED25519_SIGN_DATA.c_str(), SHA512.c_str(), message.size(),
            &message[0]);
        if (err) {
            throw runtime_error("gcry_sexp_build failed with: " + string(gcry_strerror(err)));
        }

        gcry_sexp_t gkey = *static_cast<gcry_sexp_t *>(key_);
        err = gcry_pk_sign(&sig, msg, gkey);
        if (err) {
            throw runtime_error("gcry_pk_sign failed with: " + string(gcry_strerror(err)));
        }

        // Retrieve the R and the S from the sexp.
        tmp = gcry_sexp_find_token(sig, SIG_VAL_TOKEN.c_str(), 0);
        if (!tmp) {
            throw runtime_error("gcry_sexp_find_token failed to find \"" + SIG_VAL_TOKEN + "\"!");
        }

        tmp2 = tmp;
        tmp = gcry_sexp_find_token(tmp2, EDDSA_TOKEN.c_str(), 0);
        if (!tmp) {
            throw runtime_error("gcry_sexp_find_token failed to find \"" + EDDSA_TOKEN + "\"!");
        }

        gcry_sexp_release(tmp2);
        tmp2 = tmp;
        tmp = gcry_sexp_find_token(tmp2, R_TOKEN.c_str(), 0);
        if (!tmp) {
            throw runtime_error("gcry_sexp_find_token failed to find \"" + R_TOKEN + "\"!");
        }

        size_t rLengh = 0;
        char *r = reinterpret_cast<char *>(gcry_sexp_nth_buffer(tmp, 1, &rLengh));
        if (rLengh != R_SIZE) {
            throw runtime_error("Invalid R length: " + Utils::ToString(rLengh));
        }

        gcry_sexp_release(tmp);
        tmp = gcry_sexp_find_token(tmp2, S_TOKEN.c_str(), 0);
        if (!tmp) {
            throw runtime_error("gcry_sexp_find_token failed to find \"" + S_TOKEN + "\"!");
        }

        size_t sLengh = 0;
        char *s = reinterpret_cast<char *>(gcry_sexp_nth_buffer(tmp, 1, &sLengh));
        if (sLengh != S_SIZE) {
            throw runtime_error("Invalid S length: " + Utils::ToString(sLengh));
        }

        gcry_sexp_release(tmp);
        gcry_sexp_release(tmp2);
        tmp = nullptr;
        tmp2 = nullptr;

        res.insert(res.end(), r, r + rLengh);
        res.insert(res.end(), s, s + sLengh);
    } catch (...) {
        gcry_sexp_release(tmp2);
        gcry_sexp_release(tmp);
        gcry_sexp_release(sig);
        gcry_sexp_release(msg);

        throw;
    }

    gcry_sexp_release(tmp2);
    gcry_sexp_release(tmp);
    gcry_sexp_release(sig);
    gcry_sexp_release(msg);

    return res;
}

bool ED25519Key::Verify(const vector<uint8_t> &message, const vector<uint8_t> &signature) const {
    if (message.empty()) {
        throw new invalid_argument("Invalid message!");
    }

    if (signature.size() != SIGNATURE_SIZE) {
        throw runtime_error("Invalid signature length: " + Utils::ToString(signature.size()));
    }

    gcry_sexp_t msg = nullptr;
    gcry_sexp_t sig = nullptr;
    bool res = false;

    try {
        // Build sexp representing the message.
        gcry_error_t err = gcry_sexp_build(&msg, nullptr, ED25519_SIGN_DATA.c_str(), SHA512.c_str(), message.size(),
            &message[0]);
        if (err) {
            throw runtime_error("gcry_sexp_build failed with: " + string(gcry_strerror(err)));
        }

        // Build sexp representing the signature.

        // Get both R (the first 32 bits) and S (the last 32 bits) from the message.
        vector<uint8_t> r(signature.cbegin(), signature.cbegin() + R_SIZE);
        vector<uint8_t> s(signature.cbegin() + R_SIZE, signature.cbegin() + R_SIZE + S_SIZE);

        err = gcry_sexp_build(&sig, nullptr, ED25519_VERIFY_DATA.c_str(), r.size(), &r[0], s.size(), &s[0]);
        if (err) {
            throw runtime_error("gcry_sexp_build failed with: " + string(gcry_strerror(err)));
        }

        gcry_sexp_t gkey = *static_cast<gcry_sexp_t *>(key_);
        err = gcry_pk_verify(sig, msg, gkey);
        if (!err) {
            res = true;
        } else if (gpg_err_code(err) == GPG_ERR_BAD_SIGNATURE) {
            res = false;
        } else {
            throw runtime_error("gcry_pk_verify failed with: " + string(gcry_strerror(err)));
        }
    } catch (...) {
        gcry_sexp_release(sig);
        gcry_sexp_release(msg);

        throw;
    }

    gcry_sexp_release(sig);
    gcry_sexp_release(msg);

    return res;
}
