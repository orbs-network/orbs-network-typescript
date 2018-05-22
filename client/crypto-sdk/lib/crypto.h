#pragma once

#include "exports.h"

namespace Orbs {

class CRYPTO_EXPORT CryptoSDK {
public:
    // Initializes the Crypto SDK. This method have to be called before using any of the underlying functions.
    static void Init();

    static bool IsInitialized();
};

}
