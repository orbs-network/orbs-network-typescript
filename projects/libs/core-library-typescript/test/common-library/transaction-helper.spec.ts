import { types } from "../../src/common-library/types";
import { expect } from "chai";
import { TransactionHelper } from "../../src";
import { aDummyTransaction } from "../../src/test-kit/transaction-builders";

describe("Signature verification", () => {
  it("failed for incorrect signature", () => {
    const badlySignedTransaction: types.Transaction = aDummyTransaction();

    badlySignedTransaction.signatureData.signature = Buffer.from(
      "00000000000000000000000000000000000000000000000000000000000000",
      "hex"
    );

    const txHelper = new TransactionHelper(badlySignedTransaction);

    expect(txHelper.verifySignature()).to.be.false;
  });

  it("succeeds for a correctly generated signature", () => {
    const correctlySignedTransaction: types.Transaction = aDummyTransaction();

    const txHelper = new TransactionHelper(correctlySignedTransaction);

    expect(txHelper.verifySignature()).to.be.true;
  });
});
