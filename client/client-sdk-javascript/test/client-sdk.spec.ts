import { expect } from "chai";
import  * as chai from "chai";
import { Address } from "../src/address";
import { ED25519Key } from "../src/ed25519key";
import { OrbsClient } from "../src";
import * as sinonChai from "sinon-chai";
import * as nock from "nock";
import mockHttpServer from "./mock-server";
import { Server } from "http";
import { stubInterface } from "ts-sinon";
import { Transaction, SendTransactionInput, CallContractInput } from "orbs-interfaces";
import * as crypto from "crypto";

chai.use(sinonChai);

const senderPublicKey = new ED25519Key().publicKey;
const VIRTUAL_CHAIN_ID = "640ed3";
const senderAddress = new Address(senderPublicKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);
const contractKey = crypto.createHash("sha256").update("contractName").digest("hex");
const contractAddress = new Address(contractKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);
const HTTP_PORT = 8888;
const API_ENDPOINT = `http://localhost:${HTTP_PORT}`;
const TIMEOUT = 20;

describe("A client calls the connector interface with the correct inputs when", async function () {
  let orbsClient: OrbsClient;

  beforeEach(async () => {
    orbsClient = new OrbsClient(API_ENDPOINT, senderAddress, TIMEOUT);
  });

  it("sendTransaction() is called", async () => {
    nock(API_ENDPOINT)
      .post("/public/sendTransaction", (res: any) => {
        expect(res).to.haveOwnProperty("header");
        expect(res.header).to.haveOwnProperty("senderAddressBase58", senderAddress.toString());
        expect(res.header).to.haveOwnProperty("contractAddressBase58", contractAddress.toString());
        expect(res).to.haveOwnProperty("payload", "payload");
        return true;
      }).reply(200, { result: "ok" });

    expect(await orbsClient.sendTransaction(contractAddress, "payload")).to.be.eql("ok");
  });

  it("callContract() is called", async () => {
    nock(API_ENDPOINT)
      .post("/public/callContract", (res: any) => {
        expect(res.contractAddressBase58).to.be.eql(contractAddress.toString());
        expect(res.payload).to.be.eql("call-payload");
        return true;
      }).reply(200, { result: 12 });

    expect(await orbsClient.call(contractAddress, "call-payload")).to.be.eql(12);
  });
});
