import { types, ErrorHandler, ServiceRunner, grpc, GRPCRuntime } from "orbs-core-library";
import * as chai from "chai";
import PublicApiService from "../src/service";
import { stubInterface } from "ts-sinon";
import * as sinonChai from "sinon-chai";
import * as getPort from "get-port";
import * as request from "supertest";

chai.use(sinonChai);

const { expect } = chai;

const senderAddress: types.UniversalAddress = {
  id: new Buffer("sender"),
  scheme: 0,
  checksum: 0,
  networkId: 0
};

const contractAddress: types.ContractAddress = {
  address: "contractAddress"
};

const transaction: types.Transaction = {
  header: {
    version: 0,
    sender: senderAddress,
    timestamp: Date.now().toString()
  },
  body: {
    contractAddress,
    payload: Math.random().toString(),
  }
};

const contractInput: types.CallContractInput = {
  contractAddress,
  payload: "some-payload",
  sender: senderAddress
};

describe("Public API Service - Component Test", async function () {
  let virtualMachine: types.VirtualMachineClient;
  let transactionPool: types.TransactionPoolClient;
  let subscriptionManager: types.SubscriptionManagerClient;

  let grpcService: PublicApiService;
  let grpcServer: GRPCRuntime;
  let grpcEndpoint: string;

  beforeEach(async () => {
    grpcEndpoint = `127.0.0.1:${await getPort()}`;
    virtualMachine = stubInterface<types.VirtualMachineClient>();
    transactionPool = stubInterface<types.TransactionPoolClient>();
    subscriptionManager = stubInterface<types.SubscriptionManagerClient>();
    (<sinon.SinonStub>subscriptionManager.getSubscriptionStatus).returns({active: true, expiryTimestamp: Date.now() + 10000000});
    (<sinon.SinonStub>virtualMachine.callContract).returns({resultJson: "some-answer"});
    grpcService = new PublicApiService(virtualMachine, transactionPool, {
      nodeName: "tester"
    });
    grpcServer = await ServiceRunner.run(grpc.publicApiServer, grpcService, grpcEndpoint);
  });

  it("sent transaction through grpc propagates properly to the transaction pool", async () => {
    const client = grpc.publicApiClient({ endpoint: grpcEndpoint });

    await client.sendTransaction({ transaction });

    expect(transactionPool.addNewPendingTransaction).to.have.been.calledWith({
      transaction
    });
  });

  it("called contract through grpc propagates properly to the virtual machine", async () => {
    const client = grpc.publicApiClient({ endpoint: grpcEndpoint });
    await client.callContract(contractInput);

    expect(virtualMachine.callContract).to.have.been.calledWith(contractInput);
  });

  afterEach(async () => {
    ServiceRunner.stop(grpcServer);
  });
});
