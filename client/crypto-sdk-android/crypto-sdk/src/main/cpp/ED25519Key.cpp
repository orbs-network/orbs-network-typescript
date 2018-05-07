#include "ED25519Key.h"

#include <stdexcept>

#include "../../../../../crypto-sdk/lib/ed25519key.h"
#include "../../../../../crypto-sdk/lib/utils.h"

#include "Utilities.h"

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
    } catch (const exception &e) {
        env->ReleaseStringUTFChars(publicKey, nativePublicKey);

        Utilities::ThrowException(env, e.what());

        return;
    } catch (...) {
        env->ReleaseStringUTFChars(publicKey, nativePublicKey);

        Utilities::ThrowUnknownException(env);

        return;
    }

    env->ReleaseStringUTFChars(publicKey, nativePublicKey);
}

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_ED25519Key_init__Ljava_lang_String_2Ljava_lang_String_2(JNIEnv *env, jobject thisObj,
    jstring publicKey, jstring privateKey) {
    const char *nativePublicKey = env->GetStringUTFChars(publicKey, JNI_FALSE);
    const char *nativePrivateKey = env->GetStringUTFChars(privateKey, JNI_FALSE);

    try {
        ED25519Key *self = new ED25519Key(nativePublicKey, nativePrivateKey);
        setSelf(env, thisObj, self);
    } catch (const exception &e) {
        env->ReleaseStringUTFChars(publicKey, nativePrivateKey);
        env->ReleaseStringUTFChars(publicKey, nativePublicKey);

        Utilities::ThrowException(env, e.what());

        return;
    } catch (...) {
        env->ReleaseStringUTFChars(publicKey, nativePrivateKey);
        env->ReleaseStringUTFChars(publicKey, nativePublicKey);

        Utilities::ThrowUnknownException(env);

        return;
    }

    env->ReleaseStringUTFChars(publicKey, nativePrivateKey);
    env->ReleaseStringUTFChars(publicKey, nativePublicKey);
}

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_ED25519Key_init__(JNIEnv *env, jobject thisObj) {
    try {
        ED25519Key *self = new ED25519Key();
        setSelf(env, thisObj, self);
    } catch (const exception &e) {
        Utilities::ThrowException(env, e.what());

        return;
    } catch (...) {
        Utilities::ThrowUnknownException(env);

        return;
    }
}

JNIEXPORT void JNICALL Java_com_orbs_cryptosdk_ED25519Key_finalize(JNIEnv *env, jobject thisObj) {
    ED25519Key *self = getSelf(env, thisObj);
    if (self != nullptr) {
        delete self;

        setSelf(env, thisObj, nullptr);
    }
}

JNIEXPORT jstring JNICALL Java_com_orbs_cryptosdk_ED25519Key_getPublicKey(JNIEnv *env, jobject thisObj) {
    try {
        ED25519Key *self = getSelf(env, thisObj);

        return env->NewStringUTF(Utils::Vec2Hex(self->GetPublicKey()).c_str());
    } catch (const exception &e) {
        Utilities::ThrowException(env, e.what());

        return nullptr;
    } catch (...) {
        Utilities::ThrowUnknownException(env);

        return nullptr;
    }
}

JNIEXPORT jstring JNICALL Java_com_orbs_cryptosdk_ED25519Key_getPrivateKeyUnsafe(JNIEnv *env, jobject thisObj) {
    try {
        ED25519Key *self = getSelf(env, thisObj);

        return env->NewStringUTF(Utils::Vec2Hex(self->GetPrivateKeyUnsafe()).c_str());
    } catch (const exception &e) {
        Utilities::ThrowException(env, e.what());

        return nullptr;
    } catch (...) {
        Utilities::ThrowUnknownException(env);

        return nullptr;
    }
}

JNIEXPORT jboolean JNICALL Java_com_orbs_cryptosdk_ED25519Key_hasPrivateKey(JNIEnv *env, jobject thisObj) {
    try {
        ED25519Key *self = getSelf(env, thisObj);

        return static_cast<jboolean>(self->HasPrivateKey());
    } catch (const exception &e) {
        Utilities::ThrowException(env, e.what());

        return JNI_FALSE;
    } catch (...) {
        Utilities::ThrowUnknownException(env);

        return JNI_FALSE;
    }
}

JNIEXPORT jbyteArray JNICALL Java_com_orbs_cryptosdk_ED25519Key_sign(JNIEnv *env, jobject thisObj, jbyteArray message) {
    jbyte *messageBytes = nullptr;
    jbyteArray signature = nullptr;

    try {
        ED25519Key *self = getSelf(env, thisObj);

        messageBytes = env->GetByteArrayElements(message, nullptr);
        jsize messageBytesLength = env->GetArrayLength(message);
        vector<uint8_t> rawMessage(messageBytes, messageBytes + messageBytesLength);

        vector<uint8_t> rawSignature(self->Sign(rawMessage));
        signature = env->NewByteArray(static_cast<jsize>(rawSignature.size()));
        env->SetByteArrayRegion(signature, 0, static_cast<jsize>(rawSignature.size()), reinterpret_cast<jbyte *>(&rawSignature[0]));
    } catch (const exception &e) {
        env->ReleaseByteArrayElements(message, messageBytes, 0);

        Utilities::ThrowException(env, e.what());

        return nullptr;
    } catch (...) {
        env->ReleaseByteArrayElements(message, messageBytes, 0);

        Utilities::ThrowUnknownException(env);

        return nullptr;
    }

    env->ReleaseByteArrayElements(message, messageBytes, 0);

    return signature;
}

JNIEXPORT jboolean JNICALL Java_com_orbs_cryptosdk_ED25519Key_verify(JNIEnv *env, jobject thisObj, jbyteArray message, jbyteArray signature) {
    jboolean res;

    jbyte *messageBytes = nullptr;
    jbyte *signatureBytes = nullptr;

    try {
        ED25519Key *self = getSelf(env, thisObj);

        messageBytes = env->GetByteArrayElements(message, nullptr);
        jsize messageBytesLength = env->GetArrayLength(message);
        vector<uint8_t> rawMessage(messageBytes, messageBytes + messageBytesLength);

        signatureBytes = env->GetByteArrayElements(signature, nullptr);
        jsize signatureBytesLength = env->GetArrayLength(signature);
        vector<uint8_t> rawSignature(signatureBytes, signatureBytes + signatureBytesLength);

        res = static_cast<jboolean>(self->Verify(rawMessage, rawSignature));
    } catch (const exception &e) {
        env->ReleaseByteArrayElements(message, messageBytes, 0);
        env->ReleaseByteArrayElements(signature, signatureBytes, 0);

        Utilities::ThrowException(env, e.what());

        return JNI_FALSE;
    } catch (...) {
        env->ReleaseByteArrayElements(message, messageBytes, 0);
        env->ReleaseByteArrayElements(signature, signatureBytes, 0);

        Utilities::ThrowUnknownException(env);

        return JNI_FALSE;
    }

    env->ReleaseByteArrayElements(message, messageBytes, 0);
    env->ReleaseByteArrayElements(signature, signatureBytes, 0);

    return res;
}
