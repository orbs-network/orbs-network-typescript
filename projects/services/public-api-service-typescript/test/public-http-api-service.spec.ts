import { types, ErrorHandler } from "orbs-core-library";
import * as chai from "chai";
import PublicApiHTTPService from "../src/http-service";
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

  let httpService: PublicApiHTTPService;
  let httpEndpoint: string;

  beforeEach(async () => {
    const httpPort = await getPort();
    httpEndpoint = `http://127.0.0.1:${httpPort}`;
    virtualMachine = stubInterface<types.VirtualMachineClient>();
    transactionPool = stubInterface<types.TransactionPoolClient>();
    (<sinon.SinonStub>virtualMachine.callContract).returns({ resultJson: JSON.stringify("some-answer") });

    const httpServiceConfig = {
      nodeName: "tester",
      httpPort
    };
    httpService = new PublicApiHTTPService(virtualMachine, transactionPool, httpServiceConfig);
    httpService.start();
  });

  it("sent transaction through http propagates properly to the transaction pool", (done) => {
    request(httpEndpoint)
      .post("/public/sendTransaction")
      .send({ transaction })
      .expect(200, () => {
        expect(transactionPool.addNewPendingTransaction).to.have.been.calledWith({ transaction });
        done();
      });
  });

  it("called contract through http propagates properly to the virtual machine", (done) => {
    request(httpEndpoint)
      .post("/public/callContract")
      .send(contractInput)
      .expect(200, (err, res) => {
        expect(virtualMachine.callContract).to.have.been.calledWith(contractInput);
        expect(res.body).to.be.eql({ result: "some-answer" });
        done();
      });
  });

  afterEach(async () => {
    httpService.shutdown();
  });
});