#include "address.h"

#include "crypto-sdk/lib/crypto.h"

napi_value Init(napi_env env, napi_value exports) {
    Orbs::CryptoSDK::Init();

    return Address::Init(env, exports);
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
