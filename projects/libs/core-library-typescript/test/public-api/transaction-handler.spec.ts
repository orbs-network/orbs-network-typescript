import { types } from "../../src/common-library/types";
import { TransactionHandler, TransactionHandlerConfig } from "../../src/public-api/transaction-handler";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";

const { expect } = chai;

chai.use(chaiAsPromised);
chai.use(sinonChai);

const transactionPool = stubInterface<types.TransactionPoolClient>();
const subscriptionManager = stubInterface<types.SubscriptionManagerClient>();
const config = stubInterface<TransactionHandlerConfig>();
config.validateSubscription.returns(true);
const handler = new TransactionHandler(transactionPool, subscriptionManager, config);

function aTransactionWithSubscription(builder: { subscriptionKey: string }): types.SendTransactionInput {

  const transactionSubscriptionAppendix: types.TransactionSubscriptionAppendix = {
    subscriptionKey: builder.subscriptionKey
  };

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

  return { transaction, transactionSubscriptionAppendix};
}

describe("a transaction", () => {

  it("is processed when it includes a valid subscription key", async () => {
    const subscriptionKey = "a valid key";

    subscriptionManager.getSubscriptionStatus.withArgs({ subscriptionKey }).returns({ active: true, expiryTimestamp: -1 });

    await handler.handle(aTransactionWithSubscription({ subscriptionKey }));

    expect(transactionPool.addNewPendingTransaction).to.have.been.called;
  });

  it("is rejected when it includes an invalid subscription key", async () => {
    subscriptionManager.getSubscriptionStatus.returns({ active: false, expiryTimestamp: -1 });

    const transactionSignedWithWrongSubscriptionKey = aTransactionWithSubscription({ subscriptionKey: "some other key" });
    await expect(handler.handle(transactionSignedWithWrongSubscriptionKey)).to.be.rejected;
  });
});
