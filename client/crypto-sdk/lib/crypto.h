#pragma once

#include "exports.h"

namespace Orbs {

class CRYPTO_EXPORT CryptoSDK {
public:
    // Initializes the Crypto SDK. This method have to be called before using any of the underlying functions.
    static void Init();

    // Initializes the Crypto SDK in FIPS140-2 mode. This method have to be called before using any of the underlying functions.
    static void InitFIPSMode();

    // Checks if the SDK is running in FIPS mode.
    static bool isFIPSMode();
};

}
