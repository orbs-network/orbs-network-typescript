import { types, ErrorHandler, ServiceRunner, grpc, GRPCRuntime } from "orbs-core-library";
import * as chai from "chai";
import PublicApiService from "../src/service";
import { stubInterface } from "ts-sinon";
import * as sinonChai from "sinon-chai";
import * as getPort from "get-port";

chai.use(sinonChai);

const { expect } = chai;

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

describe("Public API Service - Component Test", async function () {
  let service: PublicApiService;
  let server: GRPCRuntime;
  let virtualMachine: types.VirtualMachineClient;
  let transactionPool: types.TransactionPoolClient;
  let subscriptionManager: types.SubscriptionManagerClient;

  const endpoint = `127.0.0.1:${await getPort()}`;

  before(async () => {
    virtualMachine = stubInterface<types.VirtualMachineClient>();
    transactionPool = stubInterface<types.TransactionPoolClient>();
    subscriptionManager = stubInterface<types.SubscriptionManagerClient>();
    (<sinon.SinonStub>subscriptionManager.getSubscriptionStatus).returns({active: true, expiryTimestamp: Date.now() + 10000000});
    service = new PublicApiService(virtualMachine, transactionPool, subscriptionManager, {
      nodeName: "tester"
    });
    server = await ServiceRunner.run(grpc.publicApiServer, service, endpoint);
  })
  it("sent transaction propagates properly to the transaction pool", async () => {
    const client = grpc.publicApiClient({ endpoint });

    const transactionSubscriptionAppendix: types.TransactionSubscriptionAppendix = {
      subscriptionKey: "foobar"
    };
    await client.sendTransaction({ transaction, transactionSubscriptionAppendix });

    expect(transactionPool.addNewPendingTransaction).to.have.been.calledWith({
      transaction
    });
  });

  after(async () => {
    ServiceRunner.stop(server);
  })
});
