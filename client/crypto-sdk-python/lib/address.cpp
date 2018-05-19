#include <boost/python.hpp>

#include "../../crypto-sdk/lib/address.h"
#include "../../crypto-sdk/lib/utils.h"

using namespace std;
using namespace boost::python;
using namespace Orbs;

void ExportAddress() {
    class_<Address>("Address", init<string, string, string>())
        .add_property("public_key", +[](const Address &a) {
            return Utils::Vec2Hex(a.GetPublicKey());
        })
        .add_property("virtual_chain_id", +[](const Address &a) {
            return Utils::Vec2Hex(a.GetVirtualChainId());
        })
        .add_property("network_id", +[](const Address &a) {
            return Utils::ToString(a.GetNetworkId());
        })
        .add_property("version", +[](const Address &a) {
            return Utils::ToString(a.GetVersion());
        })
        .add_property("account_id", +[](const Address &a) {
            return Utils::Vec2Hex(a.GetAccountId());
        })
        .add_property("checksum", +[](const Address &a) {
            return Utils::Vec2Hex(a.GetChecksum());
        })
        .def("to_string", &Address::ToString)
        .add_static_property("MAIN_NETWORK_ID", +[]() {
            return Utils::ToString(Address::MAIN_NETWORK_ID);
        })
        .add_static_property("TEST_NETWORK_ID", +[]() {
            return Utils::ToString(Address::TEST_NETWORK_ID);
        })
    ;
}
