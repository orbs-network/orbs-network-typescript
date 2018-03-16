#pragma once

#include <node_api.h>

#include <vector>

#include "../../crypto-sdk/lib/address.h"

class Address {
public:
  static napi_value Init(napi_env env, napi_value exports);
  static void Destructor(napi_env env, void *nativeObject, void *finalizeHint);

private:
  explicit Address(const std::string &publicAddress);
  ~Address();

  static napi_value New(napi_env env, napi_callback_info info);
  static napi_value ToString(napi_env env, napi_callback_info info);

private:
  static napi_ref constructor;
  napi_env env_;
  napi_ref wrapper_;

  Orbs::Address address_;
};
