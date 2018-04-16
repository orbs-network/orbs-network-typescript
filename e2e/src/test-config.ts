import { TestEnvironment } from "./test-environment";
import * as nconf from "nconf";

nconf.env({ parseValues: true });

interface TestConfig {
  testEnvironment?: TestEnvironment;
  apiEndpoint?: string;
  virtualChainId: string;
  stressTest: {
    accounts: number
  };
}

export function loadDefaultTestConfig(): TestConfig {
  const config: TestConfig = {
    virtualChainId: "640ed3",
    stressTest: {
      accounts: Number(nconf.get("E2E_ACCOUNTS_TOTAL")) || 4
    }
  };

  if (nconf.get("E2E_NO_DEPLOY")) {
    const publicApiEndpoint = nconf.get("E2E_PUBLIC_API_ENDPOINT");
    if (!publicApiEndpoint) {
      throw new Error("E2E_PUBLIC_API_ENDPOINT must be defined in a no-deploy configuration");
    }
    config.apiEndpoint = publicApiEndpoint;
  } else {
    config.testEnvironment = new TestEnvironment({
      connectFromHost: nconf.get("CONNECT_FROM_HOST"),
      preExistingPublicSubnet: nconf.get("PREEXISTING_PUBLIC_SUBNET"),
      // left-padding the vchain ID to use it in order create a 32-byte subscription key (temporary workaround..)
      testSubscriptionKey: "0x0000000000000000000000000000000000000000000000000000000000" + config.virtualChainId
    });
    config.apiEndpoint = config.testEnvironment.discoverApiEndpoint();
  }

  return config;
}
