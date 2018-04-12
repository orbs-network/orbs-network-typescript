import { expect } from "chai";
import  * as chai from "chai";
import { Address } from "../src/address";
import { ED25519Key } from "../src/ed25519key";
import { OrbsClient } from "../src";
import PublicApiConnection from "../src/public-api-connection";
import * as sinonChai from "sinon-chai";
import * as nock from "nock";
import { ContractAddress, Transaction, SendTransactionInput, CallContractInput, UniversalAddress } from "orbs-interfaces";
import mockHttpServer from "./mock-server";
import { Server } from "http";

chai.use(sinonChai);

const publicKey = new ED25519Key().publicKey;
const VIRTUAL_CHAIN_ID = "640ed3";
const senderAddress = new Address(publicKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);
const API_ENDPOINT = "http://localhost:8888";
const TIMEOUT = 20;

const universalAddress: UniversalAddress = {
  id: new Buffer(senderAddress.toString()),
  networkId: Number(Address.TEST_NETWORK_ID),
  checksum: 0,
  scheme: 0
};

const expectedTransaction: Transaction = {
  header: {
    version: 0,
    sender: universalAddress,
    timestamp: Date.now().toString()
  },
  body: {
    contractAddress: {
      address: "contractAddress"
    },
    payload: "payload"
  }
};

const expectedContract: CallContractInput = {
  sender: universalAddress,
  contractAddress: {
    address: "contractAddress"
  },
  payload: "call-payload"
};

describe("A client calls the connector interface with the correct inputs when", async function () {
  let orbsClient: OrbsClient;
  let httpServer: Server;

  beforeEach(async () => {
    orbsClient = new OrbsClient(API_ENDPOINT, senderAddress.toString(), TIMEOUT);
    httpServer = mockHttpServer(expectedTransaction, expectedContract).listen(8888);
  });

  it("sendTransaction() is called", async () => {
    expect(await orbsClient.sendTransaction("contractAddress", "payload")).to.be.eql("ok");
  });

  it("callContract() is called", async () => {
    expect(await orbsClient.call("contractAddress", "call-payload")).to.be.eql("some-answer");
  });

  afterEach(async () => {
    httpServer.close();
  });
});
