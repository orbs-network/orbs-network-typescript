#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <iostream>

#include "../lib/crypto.h"

using namespace std;
using namespace testing;
using namespace Orbs;

int main(int argc, char **argv) {
    cerr << "Initializing CryptoSDK in regular mode..." << endl;
    CryptoSDK::Init();

    InitGoogleTest(&argc, argv);
    InitGoogleMock(&argc, argv);

    return RUN_ALL_TESTS();
}
