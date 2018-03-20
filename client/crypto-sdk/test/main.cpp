#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <iostream>

#include "../lib/crypto.h"

using namespace std;
using namespace testing;
using namespace Orbs;

static const string FIPS_OPTION("--fips");

static bool InFipsMode(int argc, char **argv) {
    for (uint32_t i = 0; i < argc; ++i) {
        if (FIPS_OPTION == argv[i]) {
            return true;
        }
    }

    return false;
}

int main(int argc, char **argv) {
    if (!InFipsMode(argc, argv)) {
        cerr << "Initializing CryptoSDK in normal mode..." << endl;
        CryptoSDK::Init();
    } else {
        cerr << "Initializing CryptoSDK in FIPS 140-2 mode..." << endl;
        CryptoSDK::InitFIPSMode();
    }

    InitGoogleTest(&argc, argv);
    InitGoogleMock(&argc, argv);

    return RUN_ALL_TESTS();
}
