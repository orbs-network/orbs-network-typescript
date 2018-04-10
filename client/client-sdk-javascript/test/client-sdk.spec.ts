import { expect } from "chai";
import  * as chai from "chai";
import { Address, ED25519Key } from "orbs-crypto-sdk";
import { OrbsClient } from "../src";
import PublicApiConnection from "../src/public-api-connection";
import { stubInterface } from "ts-sinon";
import * as sinonChai from "sinon-chai";
import { ContractAddress, Transaction, SendTransactionInput, CallContractInput } from "orbs-interfaces";
import * as crypto from "crypto";

chai.use(sinonChai);

const publicKey = crypto.randomBytes(32).toString("hex");
const VIRTUAL_CHAIN_ID = "640ed3";
const senderAddress = new Address(publicKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);

describe("A client executes the connector interface with the correct inputs when", async function () {
  let orbsClient: OrbsClient;
  const connection = stubInterface<PublicApiConnection>();

  beforeEach(async () => {
    orbsClient = new OrbsClient(senderAddress.toString(), connection);
  });

  it("sendTransaction() is called", async () => {
    orbsClient.sendTransaction("contractAddress", "payload");
    expect(connection.sendTransaction).to.have.been.calledOnce;
    const { transaction } = <SendTransactionInput>((<sinon.SinonSpy>connection.sendTransaction).getCall(0).args[0]);
    expect(transaction.body.payload).to.be.equal("payload");
    expect(transaction.body.contractAddress.address).equal("contractAddress");
    expect(transaction.header.sender.id).deep.equal(Buffer.from(senderAddress.toString()));
  });

  it("callContract() is called", async () => {
    (<sinon.SinonStub>connection.callContract).returns({ resultJson: "{}" });
    orbsClient.call("contractAddress", "payload");
    expect(connection.callContract).to.have.been.calledOnce;
    const { contractAddress, payload } = <CallContractInput>((<sinon.SinonSpy>connection.callContract).getCall(0).args[0]);
    expect(contractAddress.address).to.equal("contractAddress");
    expect(payload).to.equal(payload);
  });

  afterEach(async () => {
    await orbsClient.disconnect();
  });
});
