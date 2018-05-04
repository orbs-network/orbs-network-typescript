#include "Utilities.h"

void Utilities::ThrowException(JNIEnv *env, const char *error) {
    jclass jcls = env->FindClass("java/lang/Exception");
    env->ThrowNew(jcls, error);
}

void Utilities::ThrowUnknownException(JNIEnv *env) {
    ThrowException(env, "Unknown exception!");
}