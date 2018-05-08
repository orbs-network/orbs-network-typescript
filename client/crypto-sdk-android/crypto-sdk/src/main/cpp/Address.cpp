#include "Address.h"

#include <stdexcept>

#include "../../../../../crypto-sdk/lib/address.h"
#include "../../../../../crypto-sdk/lib/utils.h"

#include "Utilities.h"

using namespace std;
using namespace Orbs;

static jfieldID getSelfId(JNIEnv *env, jobject thisObj) {
    jclass thisClass = env->GetObjectClass(thisObj);

    return env->GetFieldID(thisClass, "selfPtr", "J");
}

static Address *getSelf(JNIEnv *env, jobject thisObj) {
    jlong selfPtr = env->GetLongField(thisObj, getSelfId(env, thisObj));

    return *(Address **)&selfPtr;
}

static void setSelf(JNIEnv *env, jobject thisObj, Address *self) {
    jlong selfPtr = *(jlong *)&self;
    env->SetLongField(thisObj, getSelfId(env, thisObj), selfPtr);
}

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_Address_init(JNIEnv *env, jobject thisObj, jstring publicKey, jstring virtualChainId, jstring networkId) {
    const char *nativePublicKey = env->GetStringUTFChars(publicKey, JNI_FALSE);
    const char *nativeVirtualChainId = env->GetStringUTFChars(virtualChainId, JNI_FALSE);
    const char *nativeNetworkId = env->GetStringUTFChars(networkId, JNI_FALSE);
    
    try {
        Address *self = new Address(nativePublicKey, nativeVirtualChainId, nativeNetworkId);
        setSelf(env, thisObj, self);
    } catch (const exception &e) {
        env->ReleaseStringUTFChars(publicKey, nativePublicKey);
        env->ReleaseStringUTFChars(virtualChainId, nativeVirtualChainId);
        env->ReleaseStringUTFChars(networkId, nativeNetworkId);

        Utilities::ThrowException(env, e.what());

        return;
    } catch (...) {
        env->ReleaseStringUTFChars(publicKey, nativePublicKey);
        env->ReleaseStringUTFChars(virtualChainId, nativeVirtualChainId);
        env->ReleaseStringUTFChars(networkId, nativeNetworkId);

        Utilities::ThrowUnknownException(env);

        return;
    }

    env->ReleaseStringUTFChars(publicKey, nativePublicKey);
    env->ReleaseStringUTFChars(virtualChainId, nativeVirtualChainId);
    env->ReleaseStringUTFChars(networkId, nativeNetworkId);
}

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_Address_disposeNative(JNIEnv *env, jobject thisObj) {
    Address *self = getSelf(env, thisObj);
    if (self != nullptr) {
        delete self;

        setSelf(env, thisObj, nullptr);
    }
}

JNIEXPORT jstring JNICALL Java_com_orbs_cryptosdk_Address_getPublicKey(JNIEnv *env, jobject thisObj) {
    try {
        Address *self = getSelf(env, thisObj);

        return env->NewStringUTF(Utils::Vec2Hex(self->GetPublicKey()).c_str());
    } catch (const exception &e) {
        Utilities::ThrowException(env, e.what());

        return nullptr;
    } catch (...) {
        Utilities::ThrowUnknownException(env);

        return nullptr;
    }
}

JNIEXPORT jstring JNICALL Java_com_orbs_cryptosdk_Address_toString(JNIEnv *env, jobject thisObj) {
    try {
        Address *self = getSelf(env, thisObj);

        return env->NewStringUTF(self->ToString().c_str());
    } catch (const exception &e) {
        Utilities::ThrowException(env, e.what());

        return nullptr;
    } catch (...) {
        Utilities::ThrowUnknownException(env);

        return nullptr;
    }
}
