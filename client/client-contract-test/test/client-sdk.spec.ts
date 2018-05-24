import { expect, assert } from "chai";
import  * as chai from "chai";
import { OrbsContractAdapter } from "../src";
import * as sinonChai from "sinon-chai";
import { Server } from "http";
import { stubInterface, stubObject } from "ts-sinon";
import * as crypto from "crypto";
import { createJavaOrbsContract } from "./java-sdk-helper";
import * as mocha from "mocha";
import { pythonBridge, PythonBridge } from "python-bridge";
import * as path from "path";
import { OrbsClient, OrbsContract, Address, ED25519Key, OrbsContractMethodArgs } from "orbs-client-sdk";
import { SENDER_ADDRESS, CONTRACT_NAME, CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS, SENDER_PUBLIC_KEY, VIRTUAL_CHAIN_ID, SENDER_PRIVATE_KEY } from "../src/expected-results";
import { testContract } from "../src/contract-adapter";
import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest } from "../src/orbs-api-interface";

chai.use(sinonChai);

const HTTP_PORT = 8888;
const TIMEOUT = 20;
const API_ENDPOINT = `http://localhost:${HTTP_PORT}`;

class TypeScriptContractAdapter implements OrbsContractAdapter {
  orbsContract: OrbsContract;
  contractMethodName: string;
  contractMethodArgs: OrbsContractMethodArgs;

  constructor(orbsContract: OrbsContract) {
    this.orbsContract = orbsContract;
  }

  getSendTransactionObject(methodName: string, args: OrbsContractMethodArgs): Promise<OrbsAPISendTransactionRequest> {
    const sendTransactionPayload = this.orbsContract.generateSendTransactionPayload(methodName, args);
    const sendTranscationObject = this.orbsContract.orbsClient.generateTransactionRequest(this.orbsContract.contractAddress, sendTransactionPayload, Date.now());

    return Promise.resolve(sendTranscationObject);
  }

  getCallObject(methodName: string, args: OrbsContractMethodArgs): Promise<OrbsAPICallContractRequest> {
    const callPayload = this.orbsContract.generateCallPayload(methodName, args);
    const callObject = this.orbsContract.orbsClient.generateCallRequest(this.orbsContract.contractAddress, callPayload);

    return Promise.resolve(callObject);
  }
}

class JavaContractAdapter implements OrbsContractAdapter {
  javaContract: any;

  constructor(javaContract: any) {
    this.javaContract = javaContract;
  }

  getSendTransactionObject(methodName: string, args: OrbsContractMethodArgs): Promise<OrbsAPISendTransactionRequest> {
    const sendTransactionPayload = this.javaContract.generateSendTransactionPayloadSync(methodName, args);
    const javaClient = this.javaContract.getOrbsClientSync();
    const sendTransactionObjectJson = javaClient.generateTransactionRequestSync(this.javaContract.getContractAddressSync(), sendTransactionPayload);
    const sendTransactionObject = JSON.parse(sendTransactionObjectJson);
    return Promise.resolve(sendTransactionObject);
  }

  getCallObject(methodName: string, args: OrbsContractMethodArgs): Promise<OrbsAPICallContractRequest> {
    const callPayload = this.javaContract.generateCallPayloadSync(methodName, args);
    const javaClient = this.javaContract.getOrbsClientSync();
    const callObjectJson = javaClient.generateCallRequestSync(this.javaContract.getContractAddressSync(), callPayload);
    const callObject = JSON.parse(callObjectJson);
    return Promise.resolve(callObject);
  }
}

class PythonContractAdapter implements OrbsContractAdapter {
  contractName: string;
  apiEndpoint: string;
  senderPublicKey: string;
  senderPrivateKey: string;
  virtualChainId: string;
  networkId: string;
  timeoutInMillis: number;

  pythonClientRoot = path.resolve(__dirname, "../../../crypto-sdk-python/");

  constructor(contractName: string, apiEndpoint: string, senderPublicKey: string, senderPrivateKey: string,
    virtualChainId: string, networkId: string, timeoutInMillis: number) {

      this.contractName = contractName;
      this.apiEndpoint = apiEndpoint;
      this.senderPublicKey = senderPublicKey;
      this.senderPrivateKey = senderPrivateKey;
      this.virtualChainId = virtualChainId;
      this.networkId = networkId;
      this.timeoutInMillis = timeoutInMillis;

      console.log(this.pythonClientRoot);
  }

  private async createPython(): Promise<PythonBridge> {
    const python = pythonBridge({
      python: process.platform === "darwin" ? "/usr/local/bin/python" : "/usr/bin/python",
      env: {PYTHONPATH: this.pythonClientRoot}
    });

    function rethrow(e: Error) {
      python.kill("SIGKILL");
      return Promise.reject(e);
    }

    await python.ex`
      import orbs_client
      from orbs_client import pycrypto

      key_pair = pycrypto.ED25519Key(${this.senderPublicKey}, ${this.senderPrivateKey})
      address = pycrypto.Address(${this.senderPublicKey}, ${this.virtualChainId}, ${this.networkId})
      client = orbs_client.HttpClient(${this.apiEndpoint}, address, key_pair, ${this.timeoutInMillis})
      contract = orbs_client.Contract(client, ${this.contractName})

      undefined = None
    `.catch(rethrow);

    return python;
  }

  async getSendTransactionObject(methodName: string, args: OrbsContractMethodArgs): Promise<OrbsAPISendTransactionRequest> {
    const python = await this.createPython();

    const sendTransactionObject = await python`
    client.generate_transaction_request(contract.address, contract.generate_send_transaction_payload(${methodName}, ${args}))
    `;

    await python.end();

    return Promise.resolve(sendTransactionObject);
  }

  async getCallObject(methodName: string, args: OrbsContractMethodArgs): Promise<OrbsAPICallContractRequest> {
    const python = await this.createPython();

    const sendCallObject = await python`
    client.generate_call_request(contract.address, contract.generate_call_payload(${methodName}, ${args}))
    `;

    await python.end();

    return Promise.resolve(sendCallObject);

  }
}

// TODO: we do not need to use this mock server, we need to use the one that comes with public api - it is still a WIP
// let httpServer: Server;
before((done) => {
  // httpServer = mockHttpServer(expectedSendTransactionRequest, expectedCallContractRequest, expectedGetTransactionStatusRequest).listen(HTTP_PORT, done);
  done();
});

describe("The Javascript SDK", () => {
  const keyPair = new ED25519Key(SENDER_PUBLIC_KEY, SENDER_PRIVATE_KEY);
  const client = new OrbsClient(API_ENDPOINT, SENDER_ADDRESS, keyPair, TIMEOUT);
  const contract = new OrbsContract(client, CONTRACT_NAME);
  testContract(() => new TypeScriptContractAdapter(contract));
});

describe("The Java SDK", () => {
  testContract(() => new JavaContractAdapter(
    createJavaOrbsContract(CONTRACT_NAME, API_ENDPOINT, SENDER_PUBLIC_KEY, SENDER_PRIVATE_KEY, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID, TIMEOUT))
  );
});

describe("The Python SDK", () => {
  testContract(() => new PythonContractAdapter(CONTRACT_NAME, API_ENDPOINT, SENDER_PUBLIC_KEY, SENDER_PRIVATE_KEY, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID, TIMEOUT));
});

after((done) => {
  // httpServer.close(done);
  done();
});
