/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { OrbsContractMethodArgs } from "orbs-client-sdk";
import { expect } from "chai";
import { expectedSendTransactionRequest, expectedCallContractRequest, expectedCallContractRequestNoArgs, SENDER_PUBLIC_KEY, CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS } from "./expected-results";
import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest } from "./orbs-api-interface";
import { eddsa } from "elliptic";
import { createHash } from "crypto";
import * as stringify from "json-stable-stringify";

export interface OrbsContractAdapter {
    getSendTransactionObject(methodName: string, args: OrbsContractMethodArgs): Promise<OrbsAPISendTransactionRequest>;
    getCallObject(methodName: string, args: OrbsContractMethodArgs): Promise<OrbsAPICallContractRequest>;
}

function testTransactionObjectSignature(sendTransactionObject: OrbsAPISendTransactionRequest) {
  const signature = Buffer.from(sendTransactionObject.signatureData.signatureHex, "hex");

  const ec = new eddsa("ed25519");
  const message = `
    {
      "header":{
        "contractAddressBase58":"${sendTransactionObject.header.contractAddressBase58}",
        "senderAddressBase58":"${sendTransactionObject.header.senderAddressBase58}",
        "timestamp":"${sendTransactionObject.header.timestamp}",
        "version":${sendTransactionObject.header.version}
      },
      "payload":${stringify(sendTransactionObject.payload)}
    }`.replace(/\s/g, "");

  const hasher = createHash("sha256");
  hasher.update(message);
  const hash = hasher.digest();
  const key = ec.keyFromPublic(sendTransactionObject.signatureData.publicKeyHex);
  expect(key.verify([...hash], [...signature])).to.be.true;
}

export function testContract(makeContract: () => OrbsContractAdapter, options: {disableSignatureTest: boolean} = {disableSignatureTest : false}) {
    const ifit = options.disableSignatureTest ? xit : it;

    describe("calls the connector interface with the correct inputs when", async function () {

      it("getSendTransactionObject() is called", async () => {
        const sendTransactionObject = await makeContract().getSendTransactionObject(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS);
        expect(JSON.parse(sendTransactionObject.payload)).to.be.eql(JSON.parse(expectedSendTransactionRequest.payload));
        expect(sendTransactionObject).to.have.property("header").that.has.property("senderAddressBase58").that.is.eql(expectedSendTransactionRequest.header.senderAddressBase58);
        expect(sendTransactionObject).to.have.property("header").that.has.property("contractAddressBase58").that.is.eql(expectedSendTransactionRequest.header.contractAddressBase58);
        expect(sendTransactionObject).to.have.property("header").that.has.property("timestamp").that.is.a("string");

        const now = Date.now();
        // testing that timestamp is less than a couple of seconds old and not in the future
        const timestamp = Number(sendTransactionObject.header.timestamp);
        expect(timestamp).to.be.above(now - (30 * 1000));
        expect(timestamp).to.be.below(now + (10 * 1000));
      });

      ifit("getSendTransactionObject() signs transaction correctly", async () => {
        const sendTransactionObject = await makeContract().getSendTransactionObject(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS);
        expect(sendTransactionObject).to.have.property("signatureData").that.has.property("publicKeyHex").that.is.eql(SENDER_PUBLIC_KEY);

        testTransactionObjectSignature(sendTransactionObject);
      });

      it("getCallObject() is called", async () => {
        const callObject = await makeContract().getCallObject(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS);
        expect(JSON.parse(callObject.payload)).to.be.eql(JSON.parse(expectedCallContractRequest.payload));
        expect(callObject).to.have.property("contractAddressBase58", expectedCallContractRequest.contractAddressBase58);
        expect(callObject).to.have.property("senderAddressBase58", expectedCallContractRequest.senderAddressBase58);
      });

      it("getCallObject() is called, undefined args", async () => {
        const callObject = await makeContract().getCallObject(CONTRACT_METHOD_NAME, undefined);
        expect(JSON.parse(callObject.payload)).to.be.eql(JSON.parse(expectedCallContractRequestNoArgs.payload));
        expect(callObject).to.have.property("contractAddressBase58", expectedCallContractRequestNoArgs.contractAddressBase58);
        expect(callObject).to.have.property("senderAddressBase58", expectedCallContractRequestNoArgs.senderAddressBase58);
      });
    });
}
