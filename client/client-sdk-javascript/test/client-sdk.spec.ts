import { expect } from "chai";
import  * as chai from "chai";
import { Address } from "../src/address";
import { ED25519Key } from "../src/ed25519key";
import { OrbsClient } from "../src";
import PublicApiConnection from "../src/public-api-connection";
import { stubInterface } from "ts-sinon";
import * as sinonChai from "sinon-chai";
import * as nock from "nock";
import { ContractAddress, Transaction, SendTransactionInput, CallContractInput } from "orbs-interfaces";

chai.use(sinonChai);

const publicKey = new ED25519Key().publicKey;
const VIRTUAL_CHAIN_ID = "640ed3";
const senderAddress = new Address(publicKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);
const API_ENDPOINT = "http://localhost:8888";
const TIMEOUT = 20;

describe("A client calls the connector interface with the correct inputs when", async function () {
  let orbsClient: OrbsClient;
  const connection = stubInterface<PublicApiConnection>();

  beforeEach(async () => {
    orbsClient = new OrbsClient(API_ENDPOINT, senderAddress.toString(), TIMEOUT);
  });

  it("sendTransaction() is called", async () => {
    nock(API_ENDPOINT)
      .post("/public/sendTransaction", (res: any) => {
        expect(res.transaction.body).to.be.eql({
          contractAddress: {
            address: "contractAddress"
          },
          payload: "payload"
        });
        return true;
      }).reply(200, { result: "ok" });

    expect(await orbsClient.sendTransaction("contractAddress", "payload")).to.be.eql("ok");
  });

  it("callContract() is called", async () => {
    nock(API_ENDPOINT)
      .post("/public/callContract", (res: any) => {
        expect(res.contractAddress).to.be.eql({ address: "contractAddress" });
        expect(res.payload).to.be.eql("call-payload");
        return true;
      }).reply(200, { result: 12 });

    expect(await orbsClient.call("contractAddress", "call-payload")).to.be.eql(12);
  });
});
