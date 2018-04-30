import * as mocha from "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as getPort from "get-port";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import BigNumber from "bignumber.js";

import { types, ErrorHandler, GRPCServerBuilder, grpc, logger, grpcServer, PendingTransactionPool, CommittedTransactionPool, TransactionHelper, TransactionValidator } from "orbs-core-library";
import { TransactionReceipt, Transaction, TransactionEntry, GossipListenerInput, GossipClient } from "orbs-interfaces";
import TransactionPoolService from "../src/transaction-pool-service";


const { expect } = chai;

ErrorHandler.setup();

logger.configure({ level: "debug" });

chai.use(chaiAsPromised);


const DUMMY_TRANSACTION_PAYLOAD = "transformer";

function createDummyTransaction(): Transaction {
    return {
        header: {
            contractAddress: new Buffer("some address"),
            sender: new Buffer("some sender"),
            timestamp: Date.now().toString(),
            version: 1
        },
        payload: DUMMY_TRANSACTION_PAYLOAD
    };
}

function createGossipMessagePayload(transaction?: Transaction): GossipListenerInput {
    if (transaction === undefined) {
        transaction = createDummyTransaction();
    }
    return {
        broadcastGroup: "does not matter",
        fromAddress: "dummy address",
        messageType: "newTransaction",
        buffer: new Buffer(JSON.stringify({ transaction }))
    };
}


describe("transaction pool service tests", function() {
    let server: GRPCServerBuilder;
    let client: types.TransactionPoolClient;
    let pendingTransactionPool: PendingTransactionPool;
    let committedTransactionPool: CommittedTransactionPool;

    beforeEach(async () => {
        const endpoint = `127.0.0.1:${await getPort()}`;
        const stubGossip = stubInterface<GossipClient>();
        committedTransactionPool = new CommittedTransactionPool({});
        const transactionValidator = stubInterface<TransactionValidator>();
        (<sinon.SinonStub>transactionValidator.validate).returns(true);
        pendingTransactionPool = new PendingTransactionPool(stubGossip, transactionValidator);

        server = grpcServer.builder()
            .withService("TransactionPool", new TransactionPoolService(pendingTransactionPool, committedTransactionPool, { nodeName: "tester"}))
            .onEndpoint(endpoint);

        client = grpc.transactionPoolClient({ endpoint });

        return server.start();
    });

    it("service can mark commited transactions", async () => {
        const res = await client.markCommittedTransactions({ transactionReceipts: <TransactionReceipt[]>[] });

        expect(res).to.be.empty;
    });

    it("service can mark committed transactions which are invlid / not in pending", async () => {
        const transaction = createDummyTransaction();
        const helper = new TransactionHelper(transaction);
        const txid = helper.calculateTransactionId();
        const txHash = helper.calculateHash();
        const receipt: types.TransactionReceipt = {
          txHash,
          success: true
        };
        const res = await client.markCommittedTransactions({ transactionReceipts: [ receipt ] });

        expect(res).to.be.empty;
    });

    it("service can add new pending transactions", async () => {
        const transaction = createDummyTransaction();
        const helper = new TransactionHelper(transaction);
        const res = await client.addNewPendingTransaction({ transaction });

        expect(res).to.have.property("txid").that.is.equal(helper.calculateTransactionId());
    });

    it("service can get all pending transactions", async () => {
        await client.addNewPendingTransaction({ transaction: createDummyTransaction()});
        await client.addNewPendingTransaction({ transaction: createDummyTransaction()});
        const res = await client.getAllPendingTransactions({});

        expect(res).to.ownProperty("transactionEntries");
        expect(res).to.have.property("transactionEntries").that.has.length(2);
        const transaction = res.transactionEntries[0];
        expect(transaction).to.have.property("transaction").that.has.property("payload", DUMMY_TRANSACTION_PAYLOAD);
    });

    it("service can get transaction status of a pending transaction", async () => {
        const txid = (await client.addNewPendingTransaction({ transaction: createDummyTransaction()})).txid;

        const res = await client.getTransactionStatus({txid: txid});
        logger.info(JSON.stringify(res));
        // types.TransactionStatus.PENDING
        expect(res).to.have.property("status", "PENDING");
        expect(res).to.have.property("receipt").that.is.null;
    });

    it("service can get transaction status of a committed transaction", async () => {
        const transaction = createDummyTransaction();
        const txid = (await client.addNewPendingTransaction({ transaction })).txid;
        const helper = new TransactionHelper(transaction);
        const txHash = helper.calculateHash();
        const receipt: types.TransactionReceipt = {
          txHash,
          success: true
        };

        await client.markCommittedTransactions({transactionReceipts: [ receipt ]});

        const res = await client.getTransactionStatus({txid: txid});
        // types.TransactionStatus.COMMITTED
        expect(res).to.have.property("status", "COMMITTED");
        expect(res).to.have.property("receipt").that.has.deep.property("success", receipt.success); // .that.is.not.null;
    });

    it("service can receive a gossip message", async () => {
        const res = await client.gossipMessageReceived(createGossipMessagePayload());
        expect(res).to.be.empty;

        const resOfAllPending = await client.getAllPendingTransactions({});
        expect(resOfAllPending).to.ownProperty("transactionEntries");
        expect(resOfAllPending).to.have.property("transactionEntries").that.has.length(1);
        const transaction = resOfAllPending.transactionEntries[0];
        expect(transaction).to.have.property("transaction").that.has.property("payload", DUMMY_TRANSACTION_PAYLOAD);
    });

    it("service handles de-duplication of transactions which are already pending", async () => {
        const transaction = createDummyTransaction();
        const txid = (await client.addNewPendingTransaction({ transaction })).txid;
        await expect(client.gossipMessageReceived(createGossipMessagePayload(transaction))).to.eventually.be.rejectedWith(
            `Transaction with id ${txid} already exists in the pending transaction pool`
        );
    });

    it("service handles de-duplication of transactions which are already committed", async () => {
        const transaction = createDummyTransaction();
        const txid = (await client.addNewPendingTransaction({ transaction })).txid;
        const helper = new TransactionHelper(transaction);
        const txHash = helper.calculateHash();
        const receipt: types.TransactionReceipt = {
          txHash,
          success: true
        };

        await client.markCommittedTransactions({transactionReceipts: [ receipt ]});
        await expect(client.gossipMessageReceived(createGossipMessagePayload(transaction))).to.eventually.be.rejectedWith(
            `Transaction with id ${txid} already exists in the committed transaction pool`
        );
    });

    afterEach(async () => {
        return server.stop();
    });
});
