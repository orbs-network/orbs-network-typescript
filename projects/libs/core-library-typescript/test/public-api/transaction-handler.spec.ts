import { types } from "../../src/common-library/types";
import { TransactionHandler } from "../../src/public-api/transaction-handler";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import { aDummyTransaction } from "../../src/test-kit/transaction-builders";

const { expect } = chai;

chai.use(chaiAsPromised);
chai.use(sinonChai);

const transactionPool = stubInterface<types.TransactionPoolClient>();
const handler = new TransactionHandler(transactionPool);


describe("a transaction", () => {

  it("is processed when it includes a valid subscription key", async () => {
    const transaction = aDummyTransaction();
    await handler.handle({ transaction });

    expect(transactionPool.addNewPendingTransaction).to.have.been.called;
  });
});
