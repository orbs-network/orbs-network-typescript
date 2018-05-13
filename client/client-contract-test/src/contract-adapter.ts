import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest } from "../../client-sdk-javascript/src/orbs-api-interface";
import { OrbsContractMethodArgs } from "../../client-sdk-javascript/src/orbs-contract";
import { expect } from "chai";
import { expectedSendTransactionRequest, expectedCallContractRequest } from "./expected-results";

export interface OrbsContractAdapter {
    contractMethodName: string;
    contractMethodArgs: OrbsContractMethodArgs;

    getSendTranscationObject(): OrbsAPISendTransactionRequest;
    getCallObject(): OrbsAPICallContractRequest;
}

export function testContract(makeContract: () => OrbsContractAdapter, testSignature = true) {
    const ifit = testSignature ? it : xit;

    describe("calls the connector interface with the correct inputs when", async function () {

      it("getSendTranscationObject() is called", async () => {
        const sendTransactionObject = await makeContract().getSendTranscationObject();
        expect(sendTransactionObject).to.have.property("payload").that.is.eql(expectedSendTransactionRequest.payload);
        expect(sendTransactionObject).to.have.property("header").that.has.property("senderAddressBase58").that.is.eql(expectedSendTransactionRequest.header.senderAddressBase58);
        expect(sendTransactionObject).to.have.property("header").that.has.property("contractAddressBase58").that.is.eql(expectedSendTransactionRequest.header.contractAddressBase58);
        expect(sendTransactionObject).to.have.property("header").that.has.property("timestamp").that.is.a("string");
        const now = Date.now();
        // testing that timestamp is less than a couple of seconds old and not in the future
        const timestamp = Number(sendTransactionObject.header.timestamp);
        expect(timestamp).to.be.above(now - (30 * 1000));
        expect(timestamp).to.be.below(now + (10 * 1000));
      });

      ifit("getSendTransactionObject() is called with the correct signature", async () => {
        const sendTransactionObject = await makeContract().getSendTranscationObject();
        expect(sendTransactionObject).to.have.property("signatureData").that.has.property("publicKeyHex").that.is.eql(expectedSendTransactionRequest.signatureData.publicKeyHex);
        expect(sendTransactionObject).to.have.property("signatureData").that.has.property("signatureHex").that.is.eql(expectedSendTransactionRequest.signatureData.signatureHex);
      });

      it("getCallObject() is called", async () => {
        const callObject = await makeContract().getCallObject();
        expect(callObject).to.have.property("payload").that.is.eql(expectedCallContractRequest.payload);
        expect(callObject).to.have.property("contractAddressBase58", expectedCallContractRequest.contractAddressBase58);
        expect(callObject).to.have.property("senderAddressBase58", expectedCallContractRequest.senderAddressBase58);
      });
    });
}
