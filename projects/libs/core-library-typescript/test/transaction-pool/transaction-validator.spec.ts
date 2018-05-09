import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import { TransactionValidator } from "../../src/transaction-pool/transaction-validator";
import { aDummyTransaction } from "../../src/test-kit/transaction-builders";
import { Address } from "../../src";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("transaction validation", () => {
  let transactionValidator: TransactionValidator;
  let subscriptionManager: types.SubscriptionManagerClient;

  beforeEach(() => {
    subscriptionManager = stubInterface<types.SubscriptionManagerClient>();
    transactionValidator = new TransactionValidator(subscriptionManager, {verifySignature: false});
  });

  it("succeeds for a valid transaction of an active vchain subscription", async () => {
    (<sinon.SinonStub>subscriptionManager.getSubscriptionStatus).returns({active: true});
    const tx = aDummyTransaction();
    return expect(transactionValidator.validate(tx)).to.eventually.be.true;
  });

  it("fails if the subscription is not active", async () => {
    (<sinon.SinonStub>subscriptionManager.getSubscriptionStatus).returns({active: false});
    const tx = aDummyTransaction();
    return expect(transactionValidator.validate(tx)).to.eventually.be.false;
  });

  it("fails if the virtual chain of the sender and the contract don't match", async () => {
    (<sinon.SinonStub>subscriptionManager.getSubscriptionStatus).returns({active: true});
    const tx: types.Transaction =  {
      header: {
        version: 0,
        sender: new Address(Buffer.from("00000000000000000000000000000000", "hex"), "010101").toBuffer(),
        timestamp: "0",
        contractAddress: Address.createContractAddress("dummyContract", "020202").toBuffer()
      },
      payload: "{}",
      signatureData: undefined
    };
    return expect(transactionValidator.validate(tx)).to.eventually.be.false;
  });
});

describe("transaction validator with enabled signature verification ", () => {
  let transactionValidator: TransactionValidator;
  let subscriptionManager: types.SubscriptionManagerClient;

  beforeEach(() => {
    subscriptionManager = stubInterface<types.SubscriptionManagerClient>();
    (<sinon.SinonStub>subscriptionManager.getSubscriptionStatus).returns({active: true});
    transactionValidator = new TransactionValidator(subscriptionManager, {verifySignature: true});
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


});
