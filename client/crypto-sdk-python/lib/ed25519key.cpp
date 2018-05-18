#include <boost/python.hpp>

#include "../../crypto-sdk/lib/ed25519key.h"
#include "../../crypto-sdk/lib/utils.h"

using namespace std;
using namespace boost::python;
using namespace Orbs;

void ExportED25519() {
    class_<ED25519Key, boost::noncopyable>("ED25519Key", init<>())
        .def(init<string>())
        .def(init<string, string>())
        .add_property("public_key", +[](const ED25519Key &k) { return Utils::Vec2Hex(k.GetPublicKey()); })
        .add_property("unsafe_private_key", +[](const ED25519Key &k) { return Utils::Vec2Hex(k.GetPrivateKeyUnsafe()); })
        .add_property("has_private_key", &ED25519Key::HasPrivateKey)
        .def("sign", +[](const ED25519Key &k, const string &message) { return Utils::Vec2Hex(k.Sign(Utils::Hex2Vec(message))); })
        .def("verify", +[](const ED25519Key &k, const string &message, const string &signature) { return k.Verify(Utils::Hex2Vec(message), Utils::Hex2Vec(signature)); })
    ;
}
