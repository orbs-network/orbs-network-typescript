#include <node_api.h>

#include <assert.h>

#include "crypto-sdk/lib/utils.h"

#include "ed25519key.h"

using namespace std;

napi_ref ED25519Key::constructor;

ED25519Key::ED25519Key(const string &publicKey) : env_(nullptr), wrapper_(nullptr), key_(Orbs::Utils::Hex2Vec(publicKey)) {
}

ED25519Key::ED25519Key() : env_(nullptr), wrapper_(nullptr) {
}

ED25519Key::~ED25519Key() {
    napi_delete_reference(env_, wrapper_);
}

void ED25519Key::Destructor(napi_env env, void *nativeObject, void * /*finalize_hint*/) {
  reinterpret_cast<ED25519Key *>(nativeObject)->~ED25519Key();
}

#define DECLARE_NAPI_METHOD(name, func) { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value ED25519Key::Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_property_descriptor properties[] = {
        { "publicKey", 0, 0, GetPublicKey, nullptr, 0, napi_default, 0 }
    };

    napi_value cons;
    status = napi_define_class(env, "ED25519Key", NAPI_AUTO_LENGTH, New, nullptr,
        sizeof(properties) / sizeof(properties[0]), properties, &cons);
    assert(status == napi_ok);

    status = napi_create_reference(env, cons, 1, &constructor);
    assert(status == napi_ok);

    status = napi_set_named_property(env, exports, "ED25519Key", cons);
    assert(status == napi_ok);
    return exports;
}

napi_value ED25519Key::New(napi_env env, napi_callback_info info) {
    napi_status status;

    napi_value target;
    status = napi_get_new_target(env, info, &target);
    assert(status == napi_ok);
    bool is_constructor = target != nullptr;

    if (is_constructor) {
        // Invoked as constructor: `new ED25519Key(...)`
        size_t argc = 1;
        napi_value args[1];
        napi_value jsthis;
        status = napi_get_cb_info(env, info, &argc, args, &jsthis, nullptr);
        assert(status == napi_ok);

        ED25519Key *obj = nullptr;

        if (argc >= 1) {
            size_t publicKeyLength;
            status = napi_get_value_string_utf8(env, args[0], nullptr, 0, &publicKeyLength);
            assert(status == napi_ok);
            char publicKey[publicKeyLength + 1];
            napi_get_value_string_utf8(env, args[0], publicKey, publicKeyLength + 1, 0);

            obj = new ED25519Key(publicKey);
        } else {
            obj = new ED25519Key();
        }

        obj->env_ = env;
        status = napi_wrap(env, jsthis, reinterpret_cast<void *>(obj), ED25519Key::Destructor, nullptr, &obj->wrapper_);
        assert(status == napi_ok);

        return jsthis;
    }

    // Invoked as plain function `ED25519Key(...)`, turn into construct call.
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

napi_value ED25519Key::GetPublicKey(napi_env env, napi_callback_info info) {
    napi_status status;

    napi_value jsthis;
    status = napi_get_cb_info(env, info, nullptr, nullptr, &jsthis, nullptr);
    assert(status == napi_ok);

    ED25519Key *obj;
    status = napi_unwrap(env, jsthis, reinterpret_cast<void **>(&obj));
    assert(status == napi_ok);

    const string str(Orbs::Utils::Vec2Hex(obj->key_.GetPublicKey()));
    napi_value res;
    status = napi_create_string_utf8(env, str.c_str(), str.length(), &res);

    return res;
}
