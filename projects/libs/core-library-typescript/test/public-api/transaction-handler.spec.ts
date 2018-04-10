import { types } from "../../src/common-library/types";
import { TransactionHandler } from "../../src/public-api/transaction-handler";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";

const { expect } = chai;

chai.use(chaiAsPromised);
chai.use(sinonChai);

const transactionPool = stubInterface<types.TransactionPoolClient>();
const handler = new TransactionHandler(transactionPool);

function aTransaction(): types.SendTransactionInput {
  const senderAddress: types.UniversalAddress = {
    id: new Buffer("sender"),
    scheme: 0,
    checksum: 0,
    networkId: 0
  };

  const transaction: types.Transaction = {
      header: {
        version: 0,
        sender: senderAddress,
        timestamp: Date.now().toString()
      },
      body: {
        contractAddress: {address: "contractAddress"},
        payload: Math.random().toString(),
      }
  };

  return { transaction };
}

describe("a transaction", () => {

  it("is processed when it includes a valid subscription key", async () => {
    await handler.handle(aTransaction());

    expect(transactionPool.addNewPendingTransaction).to.have.been.called;
  });
});
