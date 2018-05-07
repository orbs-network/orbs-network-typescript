import { expect, assert } from "chai";
import  * as chai from "chai";
import { Address } from "../src/address";
import { ED25519Key } from "../src/ed25519key";
import { OrbsClient } from "../src";
import * as sinonChai from "sinon-chai";
import mockHttpServer from "./mock-server";
import { Server } from "http";
import { stubInterface } from "ts-sinon";
import * as crypto from "crypto";
import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest, OrbsAPIGetTransactionStatusRequest } from "../src/orbs-api-interface";
import { OrbsContract, OrbsContractMethodArgs } from "../src/orbs-contract";
import { method } from "bluebird";
import { createJavaOrbsContract } from "./java-sdk-helper";
import "mocha";
import { SendTransactionOutput } from "orbs-interfaces";
import { pythonBridge, PythonBridge } from "python-bridge";
import * as path from "path";

chai.use(sinonChai);

const VIRTUAL_CHAIN_ID = "640ed3";
const CONTRACT_NAME = "contractName";
const CONTRACT_METHOD_NAME = "method";
const CONTRACT_METHOD_ARGS: OrbsContractMethodArgs = ["some-string", 3];
const HTTP_PORT = 8888;
const API_ENDPOINT = `http://localhost:${HTTP_PORT}`;
const TIMEOUT = 20;
const SENDER_PUBLIC_KEY = new ED25519Key().publicKey;
const SENDER_ADDRESS = new Address(SENDER_PUBLIC_KEY, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);
const TXID = "ada0838c9a4c86625d665cc6f2d617efa15a184e434ce1d1ee66f6e057fd0ae8";

interface OrbsContractAdapter {
  sendTransaction(methodName: string, args: OrbsContractMethodArgs): Promise<SendTransactionOutput> ;
  call(methodName: string, args: OrbsContractMethodArgs): Promise<any> ;
}

class TypeScriptContractAdapter implements OrbsContractAdapter {

  orbsContract: OrbsContract;

  constructor(orbsContract: OrbsContract) {
    this.orbsContract = orbsContract;
  }

  async sendTransaction(methodName: string, args: OrbsContractMethodArgs): Promise<SendTransactionOutput> {
    return this.orbsContract.sendTransaction(methodName, args);
  }
  async call(methodName: string, args: OrbsContractMethodArgs) {
    return this.orbsContract.call(methodName, args);
  }
}

class JavaContractAdapter implements OrbsContractAdapter {
  javaContract: any;

  constructor(javaContract: any) {
    this.javaContract = javaContract;
  }

  async sendTransaction(methodName: string, args: OrbsContractMethodArgs): Promise<SendTransactionOutput> {
    return Promise.resolve(this.javaContract.sendTransactionSync(methodName, args));
  }

  async call(methodName: string, args: OrbsContractMethodArgs): Promise<any> {
    return Promise.resolve(this.javaContract.callSync(methodName, args));
  }
}

class PythonContractAdapter implements OrbsContractAdapter {
  contractName: string;
  apiEndpoint: string;
  senderPublicKey: string;
  virtualChainId: string;
  networkId: string;
  timeoutInMillis: number;

  pythonClientRoot = path.resolve(__dirname, "../../../crypto-sdk-python/");

  constructor(contractName: string, apiEndpoint: string, senderPublicKey: string,
    virtualChainId: string, networkId: string, timeoutInMillis: number) {

      this.contractName = contractName;
      this.apiEndpoint = apiEndpoint;
      this.senderPublicKey = senderPublicKey;
      this.virtualChainId = virtualChainId;
      this.networkId = networkId;
      this.timeoutInMillis = timeoutInMillis;

      console.log(this.pythonClientRoot);
  }

  private async createPython(): Promise<PythonBridge> {
    const python = pythonBridge({
      env: {PYTHONPATH: this.pythonClientRoot}
    });

    function rethrow(e: Error) {
      python.kill("SIGKILL");
      return Promise.reject(e);
    }

    await python.ex`
      import orbs_client

      address = orbs_client.Address(${this.senderPublicKey}, ${this.virtualChainId}, ${this.networkId})
      client = orbs_client.HttpClient(${this.apiEndpoint}, address, ${this.timeoutInMillis})
      contract = orbs_client.Contract(client, ${this.contractName})`.catch(rethrow);

    return python;
  }

  async sendTransaction(methodName: string, args: OrbsContractMethodArgs): Promise<SendTransactionOutput> {

    const python = await this.createPython();
    const result = await python`contract.send_transaction(${methodName}, ${args})`;
    await python.end();

    return result;
  }

  async call(methodName: string, args: OrbsContractMethodArgs): Promise<any> {
    const python = await this.createPython();
    const result = await python`contract.call(${methodName}, ${args})`;
    await python.end();

    return result;
  }

}

function expectedContractAddressBase58(contractName: string) {
  const contractKey = crypto.createHash("sha256").update(contractName).digest("hex");
  const contractAddress = new Address(contractKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);

  return contractAddress.toString();
}

function expectedPayload(methodName: string, args: OrbsContractMethodArgs) {
  return JSON.stringify({
    method: methodName,
    args: args
  });
}

const expectedSendTransactionRequest: OrbsAPISendTransactionRequest = {
  header: {
    version: 0,
    senderAddressBase58: SENDER_ADDRESS.toString(),
    timestamp: Date.now().toString(),
    contractAddressBase58: expectedContractAddressBase58(CONTRACT_NAME)
  },
  payload: expectedPayload(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)
};


const expectedCallContractRequest: OrbsAPICallContractRequest = {
  contractAddressBase58: expectedContractAddressBase58(CONTRACT_NAME),
  senderAddressBase58: SENDER_ADDRESS.toString(),
  payload: expectedPayload(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)
};

const expectedGetTransactionStatusRequest: OrbsAPIGetTransactionStatusRequest = {
  txid: TXID
};

let httpServer: Server;
before((done) => {
  httpServer = mockHttpServer(expectedSendTransactionRequest, expectedCallContractRequest, expectedGetTransactionStatusRequest).listen(HTTP_PORT, done);
});

describe("The Javascript SDK", () => {
  testContract(() => new TypeScriptContractAdapter(new OrbsContract(new OrbsClient(API_ENDPOINT, SENDER_ADDRESS, TIMEOUT), CONTRACT_NAME)));
});

describe.only("The Java SDK", () => {
  testContract(() => new JavaContractAdapter(createJavaOrbsContract(CONTRACT_NAME, API_ENDPOINT, SENDER_PUBLIC_KEY, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID, TIMEOUT)));
});

describe("The Python SDK", () => {
  testContract(() => new PythonContractAdapter(CONTRACT_NAME, API_ENDPOINT, SENDER_PUBLIC_KEY, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID, TIMEOUT));
});

after((done) => {
  httpServer.close(done);
});

function testContract(makeContract: () => OrbsContractAdapter) {

    describe("calls the connector interface with the correct inputs when", async function () {

      it("sendTransaction() is called", async () => {
        expect(await makeContract().sendTransaction(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)).to.be.eql("ok");
      });

      it("callContract() is called", async () => {
        expect(await makeContract().call(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)).to.be.eql("some-answer");
      });

    });

}
