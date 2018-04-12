import { types, ErrorHandler, grpcServer, GRPCServerBuilder, Service } from "orbs-core-library";
import * as chai from "chai";
import PublicApiHTTPService from "../src/http-service";
import { stubInterface } from "ts-sinon";
import * as sinonChai from "sinon-chai";
import * as getPort from "get-port";
import * as request from "supertest";
import httpServer from "../src/server";

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

class FakeVirtualMachineService extends Service implements types.VirtualMachineServer {
  async initialize(): Promise<void> {

  }

  async shutdown(): Promise<void> {

  }

  @Service.RPCMethod
  callContract(rpc: types.CallContractContext): void {
    expect(rpc.req.contractAddress).to.be.eql({ address: "contractAddress" });
    expect(rpc.req.payload).to.be.eql("some-payload");

    rpc.res = { resultJson: JSON.stringify("some-answer") };
  }

  processTransactionSet(rpc: types.ProcessTransactionSetContext): void {
    throw new Error("Method not implemented.");
  }
}

class FakeTransactionPool extends Service implements types.TransactionPoolServer {
  @Service.RPCMethod
  addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext): void {
    expect(rpc.req).to.be.eql({ transaction });
  }

  getAllPendingTransactions(rpc: types.GetAllPendingTransactionsContext): void {
    throw new Error("Method not implemented.");
  }

  markCommittedTransactions(rpc: types.MarkCommittedTransactionsContext): void {
    throw new Error("Method not implemented.");
  }

  gossipMessageReceived(rpc: types.GossipMessageReceivedContext): void {
    throw new Error("Method not implemented.");
  }

  async initialize(): Promise<void> {

  }

  async shutdown(): Promise<void> {

  }
}


describe("Public API Service - Component Test", async function () {
  let httpService: PublicApiHTTPService;
  let httpEndpoint: string;

  let grpcService: GRPCServerBuilder;

  beforeEach(async () => {
    const httpPort = await getPort();
    httpEndpoint = `http://127.0.0.1:${httpPort}`;
    const endpoint = `0.0.0.0:${await getPort()}`;

    grpcService = grpcServer.builder()
      .withService("VirtualMachine", new FakeVirtualMachineService({ nodeName: "tester" }))
      .withService("TransactionPool", new FakeTransactionPool({ nodeName: "tester" }))
      .onEndpoint(endpoint);

    grpcService.start();

    const topology = {
      peers: [
        {
          service: "virtual-machine",
          endpoint,
        },
        {
          service: "consensus",
          endpoint
        }
      ],
    };

    const env = {
      NODE_NAME: "tester",
      HTTP_PORT: httpPort
    };
    httpService = httpServer(topology, env);
    httpService.start();
  });

  it("sent transaction through http propagates properly to the transaction pool", (done) => {
    request(httpEndpoint)
      .post("/public/sendTransaction")
      .send({ transaction })
      .expect(200, done);
  });

  it("called contract through http propagates properly to the virtual machine", (done) => {
    request(httpEndpoint)
      .post("/public/callContract")
      .send(contractInput)
      .expect(200, (err, res) => {
        expect(res.body).to.be.eql({ result: "some-answer" });
        done();
      });
  });

  afterEach(async () => {
    httpService.stop();
    grpcService.stop();
  });
});
