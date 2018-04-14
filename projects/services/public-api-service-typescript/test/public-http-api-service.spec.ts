import { types, ErrorHandler } from "orbs-core-library";
import * as chai from "chai";
import PublicApiHTTPService from "../src/http-service";
import { stubInterface } from "ts-sinon";
import * as sinonChai from "sinon-chai";
import * as getPort from "get-port";
import * as request from "supertest";
import * as bs58 from "bs58";

chai.use(sinonChai);

const { expect } = chai;

const senderAddressBase58 = "T1EXMPcRV5F1qEbMtPZXLEuT2BMyWS4BHuhhFUf";
const contractAddressBase58 = "T1EXMPWkjkg3o75TAKYL69AfjnGprWYcctzrw5d";
const transactionTimestamp = "12345678";
const payload = JSON.stringify({foo: "bar"});

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
    const transaction: types.Transaction = {
      header: {
        version: 0,
        timestamp: transactionTimestamp,
        sender: bs58.decode(senderAddressBase58),
        contractAddress: bs58.decode(contractAddressBase58)
      },
      payload
    };
    request(httpEndpoint)
      .post("/public/sendTransaction")
      .send({
        header: {
          version: 0,
          senderAddressBase58,
          timestamp: transactionTimestamp,
          contractAddressBase58
        },
        payload,
      })
      .expect(200, () => {
        expect(transactionPool.addNewPendingTransaction).to.have.been.calledWith({ transaction });
        done();
      });
  });

  it("called contract through http propagates properly to the virtual machine", (done) => {
    const virtualMachineCallContractInput : types.CallContractInput = {
      sender: bs58.decode(senderAddressBase58),
      contractAddress: bs58.decode(contractAddressBase58),
      payload
    };
    request(httpEndpoint)
      .post("/public/callContract")
      .send({
        senderAddressBase58,
        contractAddressBase58,
        payload,
      })
      .expect(200, (err, res) => {
        expect(virtualMachine.callContract).to.have.been.calledWith(virtualMachineCallContractInput);
        expect(res.body).to.be.eql({ result: "some-answer" });
        done();
      });
  });

  afterEach(async () => {
    httpService.shutdown();
  });
});
