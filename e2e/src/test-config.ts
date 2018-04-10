import { TestEnvironment } from "./test-environment";
import { PublicApiClient } from "orbs-interfaces";
import * as nconf from "nconf";

nconf.env({ parseValues: true });

interface TestConfig {
  testEnvironment?: TestEnvironment;
  grpcEndpoint?: string;
  subscriptionKey?: string;
  stressTest: {
    accounts: number
  };
}

export function loadDefaultTestConfig(): TestConfig {
  const config: TestConfig = {
    subscriptionKey: "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebe",
    stressTest: {
      accounts: Number(nconf.get("E2E_ACCOUNTS_TOTAL")) || 4
    }
  };

  if (nconf.get("E2E_NO_DEPLOY")) {
    const publicApiEndpoint = nconf.get("E2E_PUBLIC_API_ENDPOINT");
    if (!publicApiEndpoint) {
      throw new Error("E2E_PUBLIC_API_ENDPOINT must be defined in a no-deploy configuration");
    }
    config.grpcEndpoint = publicApiEndpoint;
  } else {
    config.testEnvironment = new TestEnvironment({
      connectFromHost: nconf.get("CONNECT_FROM_HOST"),
      preExistingPublicSubnet: nconf.get("PREEXISTING_PUBLIC_SUBNET"),
      testSubscriptionKey: config.subscriptionKey
    });
    config.grpcEndpoint = config.testEnvironment.discoverGrpcEndpoint();
  }

  return config;
}
