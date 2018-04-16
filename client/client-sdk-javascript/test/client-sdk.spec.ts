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
import { OrbsContract, OrbsContractMethodArgs } from "../src/orbs-contract";
import { method } from "bluebird";

chai.use(sinonChai);

const VIRTUAL_CHAIN_ID = "640ed3";
const CONTRACT_NAME = "contractName";
const CONTRACT_METHOD_NAME = "method";
const CONTRACT_METHOD_ARGS: OrbsContractMethodArgs = [{"foo": "bar"}];
const HTTP_PORT = 8888;
const API_ENDPOINT = `http://localhost:${HTTP_PORT}`;
const TIMEOUT = 20;
const SENDER_PUBLIC_KEY = new ED25519Key().publicKey;
const SENDER_ADDRESS = new Address(SENDER_PUBLIC_KEY, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);

function expectedContractAddressBase58(contractName: string) {
  const contractKey = crypto.createHash("sha256").update(contractName).digest("hex");
  const contractAddress = new Address(contractKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);

  return contractAddress.toString();
}

function expectedPayload(methodName: string, args: OrbsContractMethodArgs) {
  return JSON.stringify({
    method: methodName,
    args: args
  });
}

const expectedSendTransactionRequest: OrbsAPISendTransactionRequest = {
  header: {
    version: 0,
    senderAddressBase58: SENDER_ADDRESS.toString(),
    timestamp: Date.now().toString(),
    contractAddressBase58: expectedContractAddressBase58(CONTRACT_NAME)
  },
  payload: expectedPayload(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)
};


const expectedCallContractRequest: OrbsAPICallContractRequest = {
  contractAddressBase58: expectedContractAddressBase58(CONTRACT_NAME),
  senderAddressBase58: SENDER_ADDRESS.toString(),
  payload: expectedPayload(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)
};

describe("A client calls the connector interface with the correct inputs when", async function () {
  let orbsContract: OrbsContract;
  let httpServer: Server;

  beforeEach(async () => {
    const orbsClient = new OrbsClient(API_ENDPOINT, SENDER_ADDRESS, TIMEOUT);
    orbsContract = new OrbsContract(orbsClient, CONTRACT_NAME);
    httpServer = mockHttpServer(expectedSendTransactionRequest, expectedCallContractRequest).listen(HTTP_PORT);
  });

  it("sendTransaction() is called", async () => {
    expect(await orbsContract.sendTransaction(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)).to.be.eql("ok");
  });

  it("callContract() is called", async () => {
    expect(await orbsContract.call(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)).to.be.eql("some-answer");
  });

  afterEach(async () => {
    httpServer.close();
  });
});
