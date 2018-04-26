import * as mocha from "mocha";
import * as chai from "chai";
import * as getPort from "get-port";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import BigNumber from "bignumber.js";

import { types, ErrorHandler, GRPCServerBuilder, grpc, logger, grpcServer, PendingTransactionPool, CommittedTransactionPool } from "orbs-core-library";
import { TransactionReceipt, Transaction, TransactionEntry, GossipListenerInput, GossipClient } from "orbs-interfaces";
import TransactionPoolService from "../src/transaction-pool-service";


const { expect } = chai;

ErrorHandler.setup();

logger.configure({ level: "debug" });


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

function createGossipMessagePayload(): GossipListenerInput {
    return {
        broadcastGroup: "does not matter",
        fromAddress: "dummy address",
        messageType: "newTransaction",
        buffer: new Buffer(JSON.stringify({ transaction: createDummyTransaction() }))
    };
}


describe("transaction pool service tests", function() {
    let server: GRPCServerBuilder;
    let client: types.TransactionPoolClient;
    // let pendingTransactionPoolStub: PendingTransactionPool;
    let pendingTransactionPool: PendingTransactionPool;
    let committedTransactionPool: CommittedTransactionPool;

    beforeEach(async () => {
        const endpoint = `127.0.0.1:${await getPort()}`;
        // pendingTransactionPoolStub = stubInterface<PendingTransactionPool>();
        const stubGossip = stubInterface<GossipClient>();
        committedTransactionPool = new CommittedTransactionPool({});
        pendingTransactionPool = new PendingTransactionPool(stubGossip, committedTransactionPool);

        server = grpcServer.builder()
            .withService("TransactionPool", new TransactionPoolService(pendingTransactionPool, { nodeName: "tester"}))
            .onEndpoint(endpoint);

        client = grpc.transactionPoolClient({ endpoint });

        return server.start();
    });

    it("service can mark commited transactions", async () => {
        const res = await client.markCommittedTransactions({ transactionReceipts: <TransactionReceipt[]>[] });

        expect(res).to.be.empty;
    });

    it("service can add new pending transactions", async () => {
        const res = await client.addNewPendingTransaction({ transaction: createDummyTransaction()});

        expect(res).to.have.property("txid").that.has.lengthOf(64);
    });

    it("service can get all pending transactions", async () => {
        await client.addNewPendingTransaction({ transaction: createDummyTransaction()});
        const res = await client.getAllPendingTransactions({});

        expect(res).to.ownProperty("transactionEntries");
        expect(res).to.have.property("transactionEntries").that.has.length(1);
        const transaction = res.transactionEntries[0];
        expect(transaction).to.have.property("transaction").that.has.property("payload", DUMMY_TRANSACTION_PAYLOAD);
    });

    it("service can get transaction status", async () => {
        const txid = (await client.addNewPendingTransaction({ transaction: createDummyTransaction()})).txid;

        const res = await client.getTransactionStatus({txid: txid});
        // TODO: complete test, need to mock the return type to see it actually returns right?
        logger.info(JSON.stringify(res));
        // types.TransactionStatus.PENDING
        expect(res).to.have.property("status", "PENDING");
        expect(res).to.have.property("receipt").that.is.null;
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

    afterEach(async () => {
        return server.stop();
    });
});