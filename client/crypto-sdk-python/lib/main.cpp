#include <boost/python.hpp>

#include "../../crypto-sdk/lib/crypto.h"

using namespace boost::python;
using namespace Orbs;

void ExportAddress();
void ExportED25519();

BOOST_PYTHON_MODULE(pycrypto) {
    CryptoSDK::Init();

    ExportAddress();
    ExportED25519();
}
