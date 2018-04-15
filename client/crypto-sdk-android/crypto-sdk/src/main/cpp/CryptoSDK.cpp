#include "CryptoSDK.h"

#include "../../../../../crypto-sdk/lib/crypto.h"

using namespace Orbs;

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_CryptoSDK_init(JNIEnv *env, jclass thisClass) {
    CryptoSDK::Init();
}

