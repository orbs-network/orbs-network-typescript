import * as mocha from "mocha";
import * as chai from "chai";
import * as getPort from "get-port";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import BigNumber from "bignumber.js";

import { types, ErrorHandler, GRPCServerBuilder, grpc, logger, SubscriptionManager, grpcServer } from "orbs-core-library";
import SubscriptionManagerService from "../src/subscription-manager-service";

const { expect } = chai;

ErrorHandler.setup();

logger.configure({ level: "debug" });

describe("subscription manager service tests", function() {
    let server: GRPCServerBuilder;
    let client: types.SubscriptionManagerClient;
    let subscriptionManagerStub: SubscriptionManager;


    beforeEach(async () => {
      const endpoint = `127.0.0.1:${await getPort()}`;
      subscriptionManagerStub = stubInterface<SubscriptionManager>();

      server = grpcServer.builder()
          .withService("SubscriptionManager", new SubscriptionManagerService(subscriptionManagerStub, { nodeName: "tester"}))
          .onEndpoint(endpoint);

      client = grpc.subscriptionManagerClient({ endpoint });

      return server.start();

    });

    it("should get subscription status", async () => {
        (<sinon.SinonStub>subscriptionManagerStub.isSubscriptionValid).returns(true);

        const { isValid } = await client.isSubscriptionValid({ subscriptionKey: "abc" });

        expect(isValid).to.be.true;
    });


    it("should be invalid if subscription manager returns false", async () => {
        (<sinon.SinonStub>subscriptionManagerStub.isSubscriptionValid).returns(false);

        const { isValid } = await client.isSubscriptionValid({ subscriptionKey: "abc" });

        expect(isValid).to.be.false;
    });

    afterEach(async () => {
      return server.stop();
    });
});
