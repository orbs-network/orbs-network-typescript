import { types, ErrorHandler, grpcServer, GRPCServerBuilder, Service, bs58DecodeRawAddress, TransactionHelper } from "orbs-core-library";
import * as chai from "chai";
import PublicApiHTTPService from "../src/service";
import * as sinonChai from "sinon-chai";
import * as getPort from "get-port";
import * as request from "supertest";
import httpServer from "../src/server";
import mockHttpServer, { runMockServer, RequestStub } from "./mock-server";
import "mocha";
import { ChildProcess } from "child_process";

chai.use(sinonChai);

const { expect } = chai;

const senderAddressBase58 = "T00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4TM9btp";
const contractAddressBase58 = "T00LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMkGvQPR";
const publicKeyHex = "0101010101010101010101010101010101010101010101010101010101010101";
const signatureHex = "0202020202020202020202020202020202020202020202020202020202020202";
const transactionTimestamp = "12345678";
const payload = JSON.stringify({ foo: "bar" });

const transaction: types.Transaction = {
  header: {
    version: 0,
    timestamp: transactionTimestamp,
    sender: bs58DecodeRawAddress(senderAddressBase58),
    contractAddress: bs58DecodeRawAddress(contractAddressBase58)
  },
  payload,
  signatureData: {
    publicKey: Buffer.from(publicKeyHex, "hex"),
    signature: Buffer.from(signatureHex, "hex")
  }
};

const tx = new TransactionHelper(transaction);
const txid = tx.calculateTransactionId();
const txHash = tx.calculateHash();

const sendTransactionRequestData = {
  header: {
    version: 0,
    senderAddressBase58,
    timestamp: transactionTimestamp,
    contractAddressBase58
  },
  payload,
  signatureData: {
    publicKeyHex,
    signatureHex
  }
};

const callContractRequestData = {
  senderAddressBase58,
  contractAddressBase58,
  payload,
};

const getTransactionStatusData = {
  txid
};

const expectedAddNewPendingTransactionInput: types.AddNewPendingTransactionInput = {
  transaction
};

const expectedVirtualMachineCallContractInput: types.CallContractInput = {
  sender: bs58DecodeRawAddress(senderAddressBase58),
  contractAddress: bs58DecodeRawAddress(contractAddressBase58),
  payload
};

const expectedGetTransactionStatusInput: types.GetTransactionStatusInput = { txid };

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
    rpc.res = { txid };
  }

  getAllPendingTransactions(rpc: types.GetAllPendingTransactionsContext): void {
    throw new Error("Method not implemented.");
  }

  markCommittedTransactions(rpc: types.MarkCommittedTransactionsContext): void {
    throw new Error("Method not implemented.");
  }

  @Service.RPCMethod
  getTransactionStatus(rpc: types.GetTransactionStatusContext): void {
    expect(rpc.req).to.be.eql(expectedGetTransactionStatusInput);
    rpc.res = {
      status: types.TransactionStatus.COMMITTED,
      receipt: {
        success: true,
        txHash
      }
    };
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
  let httpEndpoint: string;

  let grpcService: GRPCServerBuilder;
  let httpService: PublicApiHTTPService;

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
    let httpService: ChildProcess;

    beforeEach(async () => {
      const httpPort = await getPort();
      httpEndpoint = `http://127.0.0.1:${httpPort}`;

      const stubs: RequestStub[] = [
        { path: "/public/sendTransaction", requestBody: JSON.stringify(sendTransactionRequestData), responseBody: JSON.stringify({transactionId: txid})},
        { path: "/public/callContract", requestBody: JSON.stringify(callContractRequestData), responseBody: JSON.stringify({ result: "some-answer"})},
        { path: "/public/getTransactionStatus", requestBody: JSON.stringify(getTransactionStatusData), responseBody: JSON.stringify({ status: "COMMITTED", receipt: { success: true }})}
      ];

      httpService = await runMockServer(httpPort, stubs);
      httpService.stdout.pipe(process.stdout);
      httpService.stderr.pipe(process.stderr);

    });

    runTests();

    afterEach(async () => {
      httpService.kill();
    });
  });

  function runTests() {
    it("sent transaction through http propagates properly to the transaction pool", () => {
      return request(httpEndpoint)
        .post("/public/sendTransaction")
        .send(sendTransactionRequestData)
        .expect(200)
        .then((response) => {
          const res = JSON.parse(response.text);
          expect(res).to.have.property("transactionId", txid);
        });
    });

    it("called contract through http propagates properly to the virtual machine", () => {
      return request(httpEndpoint)
        .post("/public/callContract")
        .send(callContractRequestData)
        .expect(200)
        .then((response) => {
          const res = JSON.parse(response.text);
          expect(res).to.have.property("result").that.is.eql("some-answer");
        });
    });

    it("got transaction status through http propagates properly to transaction pool", () => {
      return request(httpEndpoint)
        .post("/public/getTransactionStatus")
        .send(getTransactionStatusData)
        .expect(200)
        .then((response) => {
          const res = JSON.parse(response.text);
          expect(res).to.have.property("status", "COMMITTED");
          expect(res).to.have.property("receipt").that.has.property("success", true);
        });
    });
  }
});
