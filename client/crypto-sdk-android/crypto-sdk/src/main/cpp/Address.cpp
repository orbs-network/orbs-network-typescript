#include "Address.h"

#include "../../../../../crypto-sdk/lib/address.h"

using namespace std;
using namespace Orbs;

static jfieldID getSelfId(JNIEnv *env, jobject thisObj) {
    static int init = 0;
    static jfieldID fidSelfPtr;
    if (!init) {
        jclass thisClass = env->GetObjectClass(thisObj);
        fidSelfPtr = env->GetFieldID(thisClass, "selfPtr", "J");
    }

    return fidSelfPtr;
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
    } catch (...) {
        env->ReleaseStringUTFChars(publicKey, nativePublicKey);
        env->ReleaseStringUTFChars(virtualChainId, nativeVirtualChainId);
        env->ReleaseStringUTFChars(networkId, nativeNetworkId);

        throw;
    }

    env->ReleaseStringUTFChars(publicKey, nativePublicKey);
    env->ReleaseStringUTFChars(virtualChainId, nativeVirtualChainId);
    env->ReleaseStringUTFChars(networkId, nativeNetworkId);
}

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_Address_finalize(JNIEnv *env, jobject thisObj) {
    Address *self = getSelf(env, thisObj);
    if (self != nullptr) {
        delete self;

        setSelf(env, thisObj, nullptr);
    }
}

JNIEXPORT jstring JNICALL Java_com_orbs_cryptosdk_Address_toString(JNIEnv *env, jobject thisObj) {
    Address *self = getSelf(env, thisObj);
    const string str(self->ToString());

    return env->NewStringUTF(str.c_str());
}
