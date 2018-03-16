#include "crypto-sdk.h"

#include <string.h>
#include <stdlib.h>

#include "crypto.h"
#include "address.h"

using namespace std;
using namespace Orbs;

// Initializes the Crypto SDK. This method have to be called before using any of the underlying functions.
int crypto_init() {
    try {
        CryptoSDK::Init();
    } catch (...) {
        return -1;
    }

    return 0;
}

// Initializes the Crypto SDK in FIPS140-2 mode. This method have to be called before using any of the underlying functions.
int crypto_init_fips_mode() {
    try {
        CryptoSDK::InitFIPSMode();
    } catch (...) {
        return -1;
    }

    return 0;
}

// Initializes new address from a public key.
int crypto_address_create(uint8_t public_key[], uint8_t public_key_size, address_t *a) {
    try {
        if (NULL == public_key || public_key_size != Address::PUBLIC_KEY_SIZE || NULL == a) {
            return -1;
        }

        vector<uint8_t> publicKey(public_key, public_key + public_key_size);
        *a = new Address(publicKey);
    } catch (...) {
        return -1;
    }

    return 0;
}

// Frees an address.
void crypto_address_free(address_t *a) {
    if (NULL == a) {
        return;
    }

    delete reinterpret_cast<Address *>(*a);
    *a = NULL;
}

// Converts an address to string.
int crypto_address_to_string(address_t a, char *str, uint8_t len) {
    try {
        Address *addr = reinterpret_cast<Address *>(a);
        if (NULL == addr || NULL == str || len < Address::ADDRESS_LENGTH + 1) {
            return -1;
        }

        const string s(addr->ToString());
        if (len < s.length() + 1) {
            return -1;
        }

        memcpy(str, s.c_str(), s.length());
        str[s.length()] = '\0';
    } catch (...) {
        return -1;
    }

    return 0;
}
