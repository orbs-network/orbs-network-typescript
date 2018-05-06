#include "CryptoSDK.h"

#include <stdexcept>

#include "../../../../../crypto-sdk/lib/crypto.h"

#include "Utilities.h"

using namespace std;
using namespace Orbs;

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_CryptoSDK_init(JNIEnv *env, jclass thisClass) {
    try {
        CryptoSDK::Init();
    } catch (const exception &e) {
        Utilities::ThrowException(env, e.what());

        return;
    } catch (...) {
        Utilities::ThrowUnknownException(env);

        return;
    }
}

