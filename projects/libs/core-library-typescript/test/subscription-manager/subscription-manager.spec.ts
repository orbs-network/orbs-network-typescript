/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { SubscriptionManager, types } from "../../src";
import { stubInterface } from "ts-sinon";
import { SidechainConnector } from "orbs-interfaces";
import * as chai from "chai";
import * as mocha from "mocha";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as sinon from "sinon";

chai.use(chaiAsPromised);
chai.use(sinonChai);


describe("isSubscriptionValid()", () => {
  let subscriptionManager: SubscriptionManager;
  const sidechainConnector = stubInterface<types.SidechainConnectorClient>();
  const subscriptionKey = "0x0202020202020202020202020202020202020202020202020202020202020202";
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date("2018-05-20"));
    subscriptionManager = new SubscriptionManager(sidechainConnector, {
      ethereumContractAddress: "0x0101010101010101010101010101010101010101010101010101010101010101",
      subscriptionProfiles: {
        "testProfile": [{
          rate: 1000,
          expiresAt: new Date("2018-06-01").getTime()
        }, {
          rate: 2000,
          expiresAt: undefined
        }]
      }
    });
  });

  it("returns true for subscription with sufficient fees", async () => {
    const result = {
      id: subscriptionKey,
      profile: "testProfile",
      startTime: (new Date("2018-01-01").getTime()),
      tokens: 1000
    };
    (<sinon.SinonStub>sidechainConnector.callEthereumContract).returns(<types.CallEthereumContractOutput>{
      resultJson: JSON.stringify(result)
    });
    return expect(subscriptionManager.isSubscriptionValid(subscriptionKey)).to.eventually.be.true;
  });

  it("subscription cache is used", async () => {
    const result = {
      id: subscriptionKey,
      profile: "testProfile",
      startTime: (new Date("2018-01-01").getTime()),
      tokens: 1000
    };
    (<sinon.SinonStub>sidechainConnector.callEthereumContract).returns(<types.CallEthereumContractOutput>{
      resultJson: JSON.stringify(result)
    });
    await expect(subscriptionManager.isSubscriptionValid(subscriptionKey)).to.eventually.be.true;
    // cache hit expected below, otherwise test will fail.
    const badResult = {
      id: subscriptionKey,
      profile: "testProfile",
      startTime: (new Date("2018-01-01").getTime()),
      tokens: 900
    };
    (<sinon.SinonStub>sidechainConnector.callEthereumContract).returns(<types.CallEthereumContractOutput>{
      resultJson: JSON.stringify(result)
    });
    return expect(subscriptionManager.isSubscriptionValid(subscriptionKey)).to.eventually.be.true;
  });

  it("returns true for subscription with sufficient fees that started in the middle of this month", async () => {
    const result = {
      id: subscriptionKey,
      profile: "testProfile",
      startTime: (new Date("2018-05-15").getTime()),
      tokens: 600
    };
    (<sinon.SinonStub>sidechainConnector.callEthereumContract).returns(<types.CallEthereumContractOutput>{
      resultJson: JSON.stringify(result)
    });
    return expect(subscriptionManager.isSubscriptionValid(subscriptionKey)).to.eventually.be.true;
  });


  it("returns true for subscription with insufficient fees", async () => {
    const result = {
      id: subscriptionKey,
      profile: "testProfile",
      startTime: (new Date("2018-01-01").getTime()),
      tokens: 900
    };
    (<sinon.SinonStub>sidechainConnector.callEthereumContract).returns(<types.CallEthereumContractOutput>{
      resultJson: JSON.stringify(result)
    });
    return expect(subscriptionManager.isSubscriptionValid(subscriptionKey)).to.eventually.be.false;
  });

  it("returns true for subscription with insufficient fees that started in the middle of this month", async () => {
    const result = {
      id: subscriptionKey,
      profile: "testProfile",
      startTime: (new Date("2018-05-15").getTime()),
      tokens: 500
    };
    (<sinon.SinonStub>sidechainConnector.callEthereumContract).returns(<types.CallEthereumContractOutput>{
      resultJson: JSON.stringify(result)
    });
    return expect(subscriptionManager.isSubscriptionValid(subscriptionKey)).to.eventually.be.false;
  });

  it("returns false if the profile is not configured", async () => {
    const result = {
      id: subscriptionKey,
      profile: "nonConfiguredProfile",
      startTime: (new Date("2018-01-01").getTime()),
      tokens: 100000
    };
    (<sinon.SinonStub>sidechainConnector.callEthereumContract).returns(<types.CallEthereumContractOutput>{
      resultJson: JSON.stringify(result)
    });
    return expect(subscriptionManager.isSubscriptionValid(subscriptionKey)).to.eventually.be.false;
  });

  it("returns false if the rate went up but the subscription fee has not updated accordingly", async () => {
    clock.setSystemTime(new Date("2018-07-05"));
    const result = {
      id: subscriptionKey,
      profile: "testProfile",
      startTime: (new Date("2018-01-01").getTime()),
      tokens: 1100
    };
    (<sinon.SinonStub>sidechainConnector.callEthereumContract).returns(<types.CallEthereumContractOutput>{
      resultJson: JSON.stringify(result)
    });
    return expect(subscriptionManager.isSubscriptionValid(subscriptionKey)).to.eventually.be.false;
  });

  afterEach(() => {
    clock.restore();
  });
});
