#include "gmock/gmock.h"
#include "gtest/gtest.h"

#include "../lib/crypto.h"

using namespace testing;
using namespace Orbs;

int main(int argc, char **argv) {
    CryptoSDK::Init();

    InitGoogleTest(&argc, argv);
    InitGoogleMock(&argc, argv);

    return RUN_ALL_TESTS();
}
