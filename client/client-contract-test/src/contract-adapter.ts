import { OrbsContractMethodArgs } from "orbs-client-sdk";
import { expect } from "chai";
import { expectedSendTransactionRequest, expectedCallContractRequest, SENDER_PUBLIC_KEY } from "./expected-results";
import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest } from "./orbs-api-interface";
import { eddsa } from "elliptic";
import { createHash } from "crypto";

export interface OrbsContractAdapter {
    contractMethodName: string;
    contractMethodArgs: OrbsContractMethodArgs;

    getSendTransactionObject(): OrbsAPISendTransactionRequest;
    getCallObject(): OrbsAPICallContractRequest;
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
      "payload":${JSON.stringify(sendTransactionObject.payload)}
    }`.replace(/\s/g, "");
  const hasher = createHash("sha256");
  hasher.update(message);
  const hash = hasher.digest();
  const key = ec.keyFromPublic(sendTransactionObject.signatureData.publicKeyHex);
  console.log(sendTransactionObject.signatureData.signatureHex);
  expect(key.verify([...hash], [...signature])).to.be.true;
}

export function testContract(makeContract: () => OrbsContractAdapter, options: {disableSignatureTest: boolean} = {disableSignatureTest : false}) {
    const ifit = options.disableSignatureTest ? xit : it;

    describe("calls the connector interface with the correct inputs when", async function () {

      it("getSendTransactionObject() is called", async () => {
        const sendTransactionObject = await makeContract().getSendTransactionObject();
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

      ifit("getSendTransactionObject() signs transaction correctly", async () => {
        const sendTransactionObject = await makeContract().getSendTransactionObject();
        expect(sendTransactionObject).to.have.property("signatureData").that.has.property("publicKeyHex").that.is.eql(SENDER_PUBLIC_KEY);

        testTransactionObjectSignature(sendTransactionObject);
      });

      it("getCallObject() is called", async () => {
        const callObject = await makeContract().getCallObject();
        expect(callObject).to.have.property("payload").that.is.eql(expectedCallContractRequest.payload);
        expect(callObject).to.have.property("contractAddressBase58", expectedCallContractRequest.contractAddressBase58);
        expect(callObject).to.have.property("senderAddressBase58", expectedCallContractRequest.senderAddressBase58);
      });
    });
}
