import { types } from "../../src/common-library/types";
import { TransactionHandler, TransactionHandlerConfig } from "../../src/public-api/transaction-handler";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

const consensus = stubInterface<types.ConsensusClient>();
const subscriptionManager = stubInterface<types.SubscriptionManagerClient>();
const config = stubInterface<TransactionHandlerConfig>();
config.validateSubscription.returns(true);
const handler = new TransactionHandler(consensus, subscriptionManager, config);

function aTransactionWith(builder: { subscriptionKey: string }) {

    const transactionAppendix: types.TransactionAppendix = {
        prefetchAddresses: [],
        subscriptionKey: builder.subscriptionKey
    };

    const transaction: types.Transaction = {
        sender: "sender",
        contractAddress: "address",
        signature: "",
        payload: ""
    };

    return { transactionAppendix, transaction };
}

describe("a transaction", () => {

    xit("is processed when it includes a valid subscription key", async () => {
        const subscriptionKey = "a valid key";

        subscriptionManager.getSubscriptionStatus.withArgs({ subscriptionKey }).returns({ active: true, expiryTimestamp: -1 });

        await handler.handle(aTransactionWith({ subscriptionKey }));

        consensus.sendTransaction.should.have.been.called;
    });

    it("is rejected when it includes an invalid subscription key", async () => {
        subscriptionManager.getSubscriptionStatus.returns({ active: false, expiryTimestamp: -1 });

        await handler.handle(aTransactionWith({ subscriptionKey: "some other key" })).should.be.rejected;
    });
});
