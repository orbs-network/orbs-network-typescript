#include <node_api.h>

#include <assert.h>

#include "crypto-sdk/lib/utils.h"
#include "crypto-sdk/lib/base58.h"

#include "address.h"

using namespace std;

napi_ref Address::constructor;

Address::Address(const string &publicKey, const string &virtualChainId, const string &networkId) : env_(nullptr),
    wrapper_(nullptr), address_(publicKey, virtualChainId, networkId) {
}

Address::~Address() {
    napi_delete_reference(env_, wrapper_);
}

void Address::Destructor(napi_env env, void *nativeObject, void* /*finalize_hint*/) {
  reinterpret_cast<Address *>(nativeObject)->~Address();
}

#define DECLARE_NAPI_METHOD(name, func) { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value Address::Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_property_descriptor properties[] = {
        { "MAIN_NETWORK_ID", 0, 0, GetMainNetworkId, NULL, 0, napi_static, 0 },
        { "TEST_NETWORK_ID", 0, 0, GetTestNetworkId, NULL, 0, napi_static, 0 },
        { "networkId", 0, 0, GetNetworkId, NULL, 0, napi_default, 0 },
        { "version", 0, 0, GetVersion, NULL, 0, napi_default, 0 },
        { "virtualChainId", 0, 0, GetVirtualChainId, NULL, 0, napi_default, 0 },
        { "accountId", 0, 0, GetAccountId, NULL, 0, napi_default, 0 },
        { "checksum", 0, 0, GetChecksum, NULL, 0, napi_default, 0 },
        DECLARE_NAPI_METHOD("toString", ToString),
    };

    napi_value cons;
    status = napi_define_class(env, "Address", NAPI_AUTO_LENGTH, New, nullptr,
        sizeof(properties) / sizeof(properties[0]), properties, &cons);
    assert(status == napi_ok);

    status = napi_create_reference(env, cons, 1, &constructor);
    assert(status == napi_ok);

    status = napi_set_named_property(env, exports, "Address", cons);
    assert(status == napi_ok);
    return exports;
}

napi_value Address::New(napi_env env, napi_callback_info info) {
    napi_status status;

    napi_value target;
    status = napi_get_new_target(env, info, &target);
    assert(status == napi_ok);
    bool is_constructor = target != nullptr;

    if (is_constructor) {
        // Invoked as constructor: `new Address(...)`
        size_t argc = 3;
        napi_value args[3];
        napi_value jsthis;
        status = napi_get_cb_info(env, info, &argc, args, &jsthis, nullptr);
        assert(status == napi_ok);

        size_t publicKeyLength;
        status = napi_get_value_string_utf8(env, args[0], NULL, 0, &publicKeyLength);
        assert(status == napi_ok);
        char publicKey[publicKeyLength + 1];
        napi_get_value_string_utf8(env, args[0], publicKey, publicKeyLength + 1, 0);

        size_t virtualChainIdLength;
        status = napi_get_value_string_utf8(env, args[1], NULL, 0, &virtualChainIdLength);
        assert(status == napi_ok);
        char virtualChainId[virtualChainIdLength + 1];
        napi_get_value_string_utf8(env, args[1], virtualChainId, virtualChainIdLength + 1, 0);

        size_t networkIdLength;
        status = napi_get_value_string_utf8(env, args[2], NULL, 0, &networkIdLength);
        assert(status == napi_ok);
        char networkId[networkIdLength + 1];
        napi_get_value_string_utf8(env, args[2], networkId, networkIdLength + 1, 0);

        Address *obj = new Address(publicKey, virtualChainId, networkId);

        obj->env_ = env;
        status = napi_wrap(env, jsthis, reinterpret_cast<void*>(obj), Address::Destructor, nullptr, &obj->wrapper_);
        assert(status == napi_ok);

        return jsthis;
    }

    // Invoked as plain function `Address(...)`, turn into construct call.
    size_t argc_ = 1;
    napi_value args[1];
    status = napi_get_cb_info(env, info, &argc_, args, nullptr, nullptr);
    assert(status == napi_ok);

    const size_t argc = 1;
    napi_value argv[argc] = {args[0]};

    napi_value cons;
    status = napi_get_reference_value(env, constructor, &cons);
    assert(status == napi_ok);

    napi_value instance;
    status = napi_new_instance(env, cons, argc, argv, &instance);
    assert(status == napi_ok);

    return instance;
}

napi_value Address::GetNetworkId(napi_env env, napi_callback_info info) {
    napi_status status;

    napi_value jsthis;
    status = napi_get_cb_info(env, info, nullptr, nullptr, &jsthis, nullptr);
    assert(status == napi_ok);

    Address* obj;
    status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
    assert(status == napi_ok);

    vector<uint8_t> data;
    data.push_back(obj->address_.GetNetworkId());
    const string str(Orbs::Base58::Encode(data));
    napi_value res;
    status = napi_create_string_utf8(env, str.c_str(), str.length(), &res);

    return res;
}

napi_value Address::GetVersion(napi_env env, napi_callback_info info) {
    napi_status status;

    napi_value jsthis;
    status = napi_get_cb_info(env, info, nullptr, nullptr, &jsthis, nullptr);
    assert(status == napi_ok);

    Address* obj;
    status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
    assert(status == napi_ok);

    napi_value version;
    status = napi_create_uint32(env, obj->address_.GetVersion(), &version);
    assert(status == napi_ok);

    return version;
}

napi_value Address::GetVirtualChainId(napi_env env, napi_callback_info info) {
    napi_status status;

    napi_value jsthis;
    status = napi_get_cb_info(env, info, nullptr, nullptr, &jsthis, nullptr);
    assert(status == napi_ok);

    Address* obj;
    status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
    assert(status == napi_ok);

    const string str(Orbs::Utils::Vec2Hex(obj->address_.GetVirtualChainId()));
    napi_value res;
    status = napi_create_string_utf8(env, str.c_str(), str.length(), &res);

    return res;
}

napi_value Address::GetAccountId(napi_env env, napi_callback_info info) {
    napi_status status;

    napi_value jsthis;
    status = napi_get_cb_info(env, info, nullptr, nullptr, &jsthis, nullptr);
    assert(status == napi_ok);

    Address* obj;
    status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
    assert(status == napi_ok);

    const string str(Orbs::Utils::Vec2Hex(obj->address_.GetAccountId()));
    napi_value res;
    status = napi_create_string_utf8(env, str.c_str(), str.length(), &res);

    return res;
}

napi_value Address::GetChecksum(napi_env env, napi_callback_info info) {
    napi_status status;

    napi_value jsthis;
    status = napi_get_cb_info(env, info, nullptr, nullptr, &jsthis, nullptr);
    assert(status == napi_ok);

    Address* obj;
    status = napi_unwrap(env, jsthis, reinterpret_cast<void**>(&obj));
    assert(status == napi_ok);

    const string str(Orbs::Utils::Vec2Hex(obj->address_.GetChecksum()));
    napi_value res;
    status = napi_create_string_utf8(env, str.c_str(), str.length(), &res);

    return res;
}

static napi_value GetNetworkId(napi_env env, napi_callback_info info, uint8_t networkId) {
    napi_status status;

    napi_value jsthis;
    status = napi_get_cb_info(env, info, nullptr, nullptr, &jsthis, nullptr);
    assert(status == napi_ok);

    vector<uint8_t> data;
    data.push_back(networkId);
    const string str(Orbs::Base58::Encode(data));
    napi_value res;
    status = napi_create_string_utf8(env, str.c_str(), str.length(), &res);

    return res;
}

napi_value Address::GetMainNetworkId(napi_env env, napi_callback_info info) {
    return ::GetNetworkId(env, info,Orbs::Address::MAIN_NETWORK_ID);
}

napi_value Address::GetTestNetworkId(napi_env env, napi_callback_info info) {
    return ::GetNetworkId(env, info,Orbs::Address::TEST_NETWORK_ID);
}

napi_value Address::ToString(napi_env env, napi_callback_info info) {
    napi_status status;

    napi_value jsthis;
    status = napi_get_cb_info(env, info, nullptr, nullptr, &jsthis, nullptr);
    assert(status == napi_ok);

    Address *obj;
    status = napi_unwrap(env, jsthis, reinterpret_cast<void **>(&obj));
    assert(status == napi_ok);

    const string str(obj->address_.ToString());
    napi_value res;
    status = napi_create_string_utf8(env, str.c_str(), str.length(), &res);

    assert(status == napi_ok);

    return res;
}
