#pragma once

#include <node_api.h>

#include <vector>

#include "crypto-sdk/lib/address.h"

class Address {
public:
  static napi_value Init(napi_env env, napi_value exports);
  static void Destructor(napi_env env, void *nativeObject, void *finalizeHint);

private:
  explicit Address(const std::string &publicKey, const std::string &virtualChainId, const std::string &networkId);
  ~Address();

  static napi_value New(napi_env env, napi_callback_info info);
  static napi_value GetNetworkId(napi_env env, napi_callback_info info);
  static napi_value GetVersion(napi_env env, napi_callback_info info);
  static napi_value GetVirtualChainId(napi_env env, napi_callback_info info);
  static napi_value GetAccountId(napi_env env, napi_callback_info info);
  static napi_value GetChecksum(napi_env env, napi_callback_info info);

  static napi_value GetMainNetworkId(napi_env env, napi_callback_info info);
  static napi_value GetTestNetworkId(napi_env env, napi_callback_info info);
  static napi_value ToString(napi_env env, napi_callback_info info);

private:
  static napi_ref constructor;
  napi_env env_;
  napi_ref wrapper_;

  Orbs::Address address_;
};
