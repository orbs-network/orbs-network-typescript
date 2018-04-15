import { expect } from "chai";
import  * as chai from "chai";
import { Address } from "../src/address";
import { ED25519Key } from "../src/ed25519key";
import { OrbsClient } from "../src";
import * as sinonChai from "sinon-chai";
import mockHttpServer from "./mock-server";
import { Server } from "http";
import { stubInterface } from "ts-sinon";
import * as crypto from "crypto";
import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest } from "../src/orbs-api-interface";

chai.use(sinonChai);

const senderPublicKey = new ED25519Key().publicKey;
const VIRTUAL_CHAIN_ID = "640ed3";
const senderAddress = new Address(senderPublicKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);
const contractKey = crypto.createHash("sha256").update("contractName").digest("hex");
const contractAddress = new Address(contractKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);
const testPayload = JSON.stringify({"foo": "bar"});
const HTTP_PORT = 8888;
const API_ENDPOINT = `http://localhost:${HTTP_PORT}`;
const TIMEOUT = 20;


const expectedSendTransactionRequest: OrbsAPISendTransactionRequest = {
  header: {
    version: 0,
    senderAddressBase58: senderAddress.toString(),
    timestamp: Date.now().toString(),
    contractAddressBase58: contractAddress.toString()
  },
  payload: testPayload
};

const expectedCallContractRequest: OrbsAPICallContractRequest = {
  contractAddressBase58: contractAddress.toString(),
  senderAddressBase58: senderAddress.toString(),
  payload: testPayload
};

describe("A client calls the connector interface with the correct inputs when", async function () {
  let orbsClient: OrbsClient;
  let httpServer: Server;

  beforeEach(async () => {
    orbsClient = new OrbsClient(API_ENDPOINT, senderAddress, TIMEOUT);
    httpServer = mockHttpServer(expectedSendTransactionRequest, expectedCallContractRequest).listen(HTTP_PORT);
  });

  it("sendTransaction() is called", async () => {
    expect(await orbsClient.sendTransaction(contractAddress, testPayload)).to.be.eql("ok");
  });

  it("callContract() is called", async () => {
    expect(await orbsClient.call(contractAddress, testPayload)).to.be.eql("some-answer");
  });

  afterEach(async () => {
    httpServer.close();
  });
});
