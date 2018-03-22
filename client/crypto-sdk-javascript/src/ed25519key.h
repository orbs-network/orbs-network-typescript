#pragma once

#include <node_api.h>

#include <vector>

#include "crypto-sdk/lib/ed25519key.h"

class ED25519Key {
public:
  static napi_value Init(napi_env env, napi_value exports);
  static void Destructor(napi_env env, void *nativeObject, void *finalizeHint);

private:
  explicit ED25519Key(const std::string &publicKey);
  explicit ED25519Key();
  ~ED25519Key();

  static napi_value New(napi_env env, napi_callback_info info);
  static napi_value GetPublicKey(napi_env env, napi_callback_info info);

private:
  static napi_ref constructor;
  napi_env env_;
  napi_ref wrapper_;

  Orbs::ED25519Key key_;
};
