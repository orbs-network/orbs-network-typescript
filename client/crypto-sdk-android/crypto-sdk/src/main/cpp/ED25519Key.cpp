#include "ED25519Key.h"

#include "../../../../../crypto-sdk/lib/ed25519key.h"
#include "../../../../../crypto-sdk/lib/utils.h"

using namespace std;
using namespace Orbs;

static jfieldID getSelfId(JNIEnv *env, jobject thisObj) {
    jclass thisClass = env->GetObjectClass(thisObj);

    return env->GetFieldID(thisClass, "selfPtr", "J");
}

static ED25519Key *getSelf(JNIEnv *env, jobject thisObj) {
    jlong selfPtr = env->GetLongField(thisObj, getSelfId(env, thisObj));

    return *(ED25519Key **)&selfPtr;
}

static void setSelf(JNIEnv *env, jobject thisObj, ED25519Key *self) {
    jlong selfPtr = *(jlong *)&self;
    env->SetLongField(thisObj, getSelfId(env, thisObj), selfPtr);
}

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_ED25519Key_init__Ljava_lang_String_2(JNIEnv *env, jobject thisObj, jstring publicKey) {
    const char *nativePublicKey = env->GetStringUTFChars(publicKey, JNI_FALSE);

    try {
        ED25519Key *self = new ED25519Key(nativePublicKey);
        setSelf(env, thisObj, self);
    } catch (...) {
        env->ReleaseStringUTFChars(publicKey, nativePublicKey);

        throw;
    }

    env->ReleaseStringUTFChars(publicKey, nativePublicKey);
}

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_ED25519Key_init__(JNIEnv *env, jobject thisObj) {
    ED25519Key *self = new ED25519Key();
    setSelf(env, thisObj, self);
}

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_ED25519Key_finalize(JNIEnv *env, jobject thisObj) {
    ED25519Key *self = getSelf(env, thisObj);
    if (self != nullptr) {
        delete self;

        setSelf(env, thisObj, nullptr);
    }
}

JNIEXPORT jstring JNICALL Java_com_orbs_cryptosdk_ED25519Key_getPublicKey(JNIEnv *env, jobject thisObj) {
    ED25519Key *self = getSelf(env, thisObj);

    return env->NewStringUTF(Utils::Vec2Hex(self->GetPublicKey()).c_str());
}
