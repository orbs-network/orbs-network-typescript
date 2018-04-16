import { types, ErrorHandler, grpcServer, GRPCServerBuilder, Service, bs58DecodeRawAddress } from "orbs-core-library";
import * as chai from "chai";
import PublicApiHTTPService from "../src/service";
import * as sinonChai from "sinon-chai";
import * as getPort from "get-port";
import * as request from "supertest";
import httpServer from "../src/server";
import mockHttpServer from "./mock-server";
import { Server } from "http";

chai.use(sinonChai);

const { expect } = chai;

const senderAddressBase58 = "T00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4TM9btp";
const contractAddressBase58 = "T00LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMkGvQPR";
const transactionTimestamp = "12345678";
const payload = JSON.stringify({ foo: "bar" });

const sendTransactionRequestData = {
  header: {
    version: 0,
    senderAddressBase58,
    timestamp: transactionTimestamp,
    contractAddressBase58
  },
  payload,
};

const callContractRequestData = {
  senderAddressBase58,
  contractAddressBase58,
  payload,
};

const expectedAddNewPendingTransactionInput: types.AddNewPendingTransactionInput = {
  transaction: {
    header: {
      version: 0,
      timestamp: transactionTimestamp,
      sender: bs58DecodeRawAddress(senderAddressBase58),
      contractAddress: bs58DecodeRawAddress(contractAddressBase58)
    },
    payload
  }
};

const expectedVirtualMachineCallContractInput: types.CallContractInput = {
  sender: bs58DecodeRawAddress(senderAddressBase58),
  contractAddress: bs58DecodeRawAddress(contractAddressBase58),
  payload
};

class FakeVirtualMachineService extends Service implements types.VirtualMachineServer {
  async initialize(): Promise<void> {

  }

  async shutdown(): Promise<void> {

  }

  @Service.RPCMethod
  callContract(rpc: types.CallContractContext): void {
    expect(rpc.req).to.be.eql(expectedVirtualMachineCallContractInput);

    rpc.res = { resultJson: JSON.stringify("some-answer") };
  }

  processTransactionSet(rpc: types.ProcessTransactionSetContext): void {
    throw new Error("Method not implemented.");
  }
}

class FakeTransactionPool extends Service implements types.TransactionPoolServer {
  @Service.RPCMethod
  addNewPendingTransaction(rpc: types.AddNewPendingTransactionContext): void {
    expect(rpc.req).to.be.eql(expectedAddNewPendingTransactionInput);
  }

  getAllPendingTransactions(rpc: types.GetAllPendingTransactionsContext): void {
    throw new Error("Method not implemented.");
  }

  markCommittedTransactions(rpc: types.MarkCommittedTransactionsContext): void {
    throw new Error("Method not implemented.");
  }

  getTransactionStatus(rpc: types.GetTransactionStatusContext): void {
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

  describe("Real HTTP API", () => {
    beforeEach(async () => {
      const httpPort = await getPort();
      httpEndpoint = `http://127.0.0.1:${httpPort}`;
      const grpcEndpoint = `0.0.0.0:${await getPort()}`;

      grpcService = grpcServer.builder()
        .withService("VirtualMachine", new FakeVirtualMachineService({ nodeName: "tester" }))
        .withService("TransactionPool", new FakeTransactionPool({ nodeName: "tester" }))
        .onEndpoint(grpcEndpoint);

      grpcService.start();

      const topology = {
        peers: [
          {
            service: "virtual-machine",
            endpoint: grpcEndpoint,
          },
          {
            service: "consensus",
            endpoint: grpcEndpoint
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

    runTests();

    afterEach(async () => {
      httpService.stop();
      grpcService.stop();
    });
  });

  describe("Fake HTTP API", () => {
    let httpService: Server;

    beforeEach(async () => {
      const httpPort = await getPort();
      httpEndpoint = `http://127.0.0.1:${httpPort}`;

      httpService = mockHttpServer(sendTransactionRequestData, callContractRequestData).listen(httpPort);
    });

    runTests();

    afterEach(async () => {
      httpService.close();
    });
  });

  function runTests() {
    it("sent transaction through http propagates properly to the transaction pool", () => {
      return request(httpEndpoint)
        .post("/public/sendTransaction")
        .send(sendTransactionRequestData)
        .expect(200, { result: "ok" });
    });

    it("called contract through http propagates properly to the virtual machine", () => {
      return request(httpEndpoint)
        .post("/public/callContract")
        .send(callContractRequestData)
        .expect(200, { result: "some-answer" });
    });
  }
});
