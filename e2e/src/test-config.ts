import { TestEnvironment } from "./test-environment";
import { PublicApiClient } from "orbs-interfaces";
import { initPublicApiClient } from "./public-api-client";
import * as nconf from "nconf";

nconf.env({ parseValues: true });

interface TestConfig {
  testEnvironment?: TestEnvironment;
  publicApiClient?: PublicApiClient;
  subscriptionKey?: string;
}

export function loadDefaultTestConfig(): TestConfig {
  const config: TestConfig = {
    subscriptionKey: "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebe"
  };

  if (nconf.get("E2E_NO_DEPLOY")) {
    const publicApiEndpoint = nconf.get("E2E_PUBLIC_API_ENDPOINT");
    if (!publicApiEndpoint) {
      throw new Error("E2E_PUBLIC_API_ENDPOINT must be defined in a no-deploy configuration");
    }
    config.publicApiClient = initPublicApiClient({endpoint: publicApiEndpoint});
  } else {
    config.testEnvironment = new TestEnvironment({
      connectFromHost: nconf.get("CONNECT_FROM_HOST"),
      preExistingPublicSubnet: nconf.get("PREEXISTING_PUBLIC_SUBNET"),
      testSubscriptionKey: config.subscriptionKey
    });
    config.publicApiClient = config.testEnvironment.getPublicApiClient();
  }

  return config;
}
