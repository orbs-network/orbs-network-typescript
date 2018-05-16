import { types } from "../../src/common-library/types";
import { TransactionHandler } from "../../src/public-api/transaction-handler";
import * as chai from "chai";
import * as mocha from "mocha";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import { aDummyTransaction } from "../../src/test-kit/transaction-builders";

const { expect } = chai;

chai.use(chaiAsPromised);
chai.use(sinonChai);

const transactionPool = stubInterface<types.TransactionPoolClient>();
(<sinon.SinonStub>transactionPool.addNewPendingTransaction).returns({txid: "abc"});
const handler = new TransactionHandler(transactionPool);


describe("a transaction", () => {

  it("is processed when it includes a valid subscription key", async () => {
    const transaction = aDummyTransaction();
    await handler.handle({ transaction });

    expect(transactionPool.addNewPendingTransaction).to.have.been.called;
  });

  it("is rejected if the header version is >0", async () => {
    const transaction = aDummyTransaction();
    transaction.header.version = 1;
    await expect(handler.handle({ transaction })).to.eventually.be.rejectedWith(`Invalid transaction version: ${transaction.header.version}`);
  });
});
