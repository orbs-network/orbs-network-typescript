#pragma once

#include <jni.h>

class Utilities {
public:
    static void ThrowException(JNIEnv *env, const char *error);
    static void ThrowUnknownException(JNIEnv *env);
};