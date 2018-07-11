import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as mocha from "mocha";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import { TransactionValidator } from "../../src/transaction-pool/transaction-validator";
import { aDummyTransaction } from "../../src/test-kit/transaction-builders";
import { Address, TransactionHelper } from "../../src";
import { eddsa } from "elliptic";
const ec = new eddsa("ed25519");


chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("transaction validation", () => {
  let transactionValidator: TransactionValidator;
  let subscriptionManager: types.SubscriptionManagerClient;

  beforeEach(() => {
    subscriptionManager = stubInterface<types.SubscriptionManagerClient>();
    transactionValidator = new TransactionValidator(subscriptionManager, {verifySignature: false, verifySubscription: true});
  });

  it("succeeds for a valid transaction of an active vchain subscription", async () => {
    (<sinon.SinonStub>subscriptionManager.isSubscriptionValid).returns({isValid: true});
    const tx = aDummyTransaction();
    return expect(transactionValidator.validate(tx)).to.eventually.be.true;
  });

  it("fails if the subscription is not active", async () => {
    (<sinon.SinonStub>subscriptionManager.isSubscriptionValid).returns({isValid: false});
    const tx = aDummyTransaction();
    return expect(transactionValidator.validate(tx)).to.eventually.be.false;
  });

  it("fails if the virtual chain of the sender and the contract don't match", async () => {
    (<sinon.SinonStub>subscriptionManager.isSubscriptionValid).returns({isValid: true});
    const tx: types.Transaction =  {
      header: {
        version: 0,
        sender: new Address(Buffer.from("00000000000000000000000000000000", "hex"), "010101").toBuffer(),
        timestamp: "0",
        contractAddress: Address.createContractAddress("dummyContract", "020202").toBuffer()
      },
      payload: "{}",
      signatureData: {
        publicKey: Buffer.from("00000000000000000000000000000000"),
        signature: undefined
      }
    };
    return expect(transactionValidator.validate(tx)).to.eventually.be.false;
  });
});

describe("transaction validator with enabled signature verification ", () => {
  let transactionValidator: TransactionValidator;
  let subscriptionManager: types.SubscriptionManagerClient;

  beforeEach(() => {
    subscriptionManager = stubInterface<types.SubscriptionManagerClient>();
    (<sinon.SinonStub>subscriptionManager.isSubscriptionValid).returns({isValid: true});
    transactionValidator = new TransactionValidator(subscriptionManager, {verifySignature: true, verifySubscription: true});
  });

  it("succeeds for a correctly generated signature", () => {
    const correctlySignedTransaction: types.Transaction = aDummyTransaction();

    return expect(transactionValidator.validate(correctlySignedTransaction)).to.eventually.be.true;
  });

  it("failed for incorrect signature", () => {
    const badlySignedTransaction: types.Transaction = aDummyTransaction();

    badlySignedTransaction.signatureData.signature = Buffer.from(
      "00000000000000000000000000000000000000000000000000000000000000",
      "hex"
    );
    return expect(transactionValidator.validate(badlySignedTransaction)).to.eventually.be.false;
  });

  it("fails if the sender address and public key mismatch", () => {
    const privateKey = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";
    const key = ec.keyFromSecret(privateKey);

    const addressMismatchTransaction: types.Transaction = aDummyTransaction();
    const newFakeKey = Buffer.from("b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f600000000", "hex");
    addressMismatchTransaction.header.sender = new Address(newFakeKey).toBuffer();

    // recalculate hash
    const transactionHash = new TransactionHelper(addressMismatchTransaction).calculateHash();
    addressMismatchTransaction.signatureData.signature = Buffer.from(key.sign([...transactionHash]).toBytes());

    return expect(transactionValidator.validate(addressMismatchTransaction)).to.eventually.be.false;
  });


});
