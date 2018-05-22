#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../lib/crypto.h"

using namespace std;
using namespace testing;
using namespace Orbs;

TEST(CryptoSDK, can_be_called_more_than_once) {
    EXPECT_TRUE(CryptoSDK::IsInitialized());
    EXPECT_NO_THROW(CryptoSDK::Init());
}
