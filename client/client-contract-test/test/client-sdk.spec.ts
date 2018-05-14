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
import { SENDER_ADDRESS, CONTRACT_NAME, CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS, SENDER_PUBLIC_KEY, VIRTUAL_CHAIN_ID, SIGNATURE } from "../src/expected-results";
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

  constructor(orbsContract: OrbsContract, contractMethodName: string, contractMethodArgs: OrbsContractMethodArgs) {
    this.orbsContract = orbsContract;
    this.contractMethodArgs = contractMethodArgs;
    this.contractMethodName = contractMethodName;
  }

  getSendTranscationObject(): OrbsAPISendTransactionRequest {
    const sendTransactionPayload = this.orbsContract.generateSendTransactionPayload(this.contractMethodName, this.contractMethodArgs);
    const sendTranscationObject = this.orbsContract.orbsClient.generateTransactionRequest(this.orbsContract.contractAddress, sendTransactionPayload, Date.now());

    return sendTranscationObject;
  }
  getCallObject(): OrbsAPICallContractRequest {
    const callPayload = this.orbsContract.generateCallPayload(this.contractMethodName, this.contractMethodArgs);
    const callObject = this.orbsContract.orbsClient.generateCallRequest(this.orbsContract.contractAddress, callPayload);

    return callObject;
  }
}

class JavaContractAdapter implements OrbsContractAdapter {
  javaContract: any;
  contractMethodName: string;
  contractMethodArgs: OrbsContractMethodArgs;

  constructor(javaContract: any, contractMethodName: string, contractMethodArgs: OrbsContractMethodArgs) {
    this.javaContract = javaContract;
    this.contractMethodArgs = contractMethodArgs;
    this.contractMethodName = contractMethodName;
  }

  getSendTranscationObject(): OrbsAPISendTransactionRequest {
    const sendTransactionPayload = this.javaContract.generateSendTransactionPayloadSync(this.contractMethodName, this.contractMethodArgs);
    const javaClient = this.javaContract.getOrbsClientSync();
    const sendTransactionObjectJson = javaClient.generateTransactionRequestSync(this.javaContract.getContractAddressSync(), sendTransactionPayload);
    const sendTransactionObject = JSON.parse(sendTransactionObjectJson);
    return sendTransactionObject;
  }
  getCallObject(): OrbsAPICallContractRequest {
    const callPayload = this.javaContract.generateCallPayloadSync(this.contractMethodName, this.contractMethodArgs);
    const javaClient = this.javaContract.getOrbsClientSync();
    const callObjectJson = javaClient.generateCallRequestSync(this.javaContract.getContractAddressSync(), callPayload);
    const callObject = JSON.parse(callObjectJson);
    return callObject;
  }
}

// class PythonContractAdapter implements OrbsContractAdapter {
//   contractName: string;
//   apiEndpoint: string;
//   senderPublicKey: string;
//   virtualChainId: string;
//   networkId: string;
//   timeoutInMillis: number;

//   pythonClientRoot = path.resolve(__dirname, "../../../crypto-sdk-python/");

//   constructor(contractName: string, apiEndpoint: string, senderPublicKey: string,
//     virtualChainId: string, networkId: string, timeoutInMillis: number) {

//       this.contractName = contractName;
//       this.apiEndpoint = apiEndpoint;
//       this.senderPublicKey = senderPublicKey;
//       this.virtualChainId = virtualChainId;
//       this.networkId = networkId;
//       this.timeoutInMillis = timeoutInMillis;

//       console.log(this.pythonClientRoot);
//   }

//   private async createPython(): Promise<PythonBridge> {
//     const python = pythonBridge({
//       env: {PYTHONPATH: this.pythonClientRoot}
//     });

//     function rethrow(e: Error) {
//       python.kill("SIGKILL");
//       return Promise.reject(e);
//     }

//     await python.ex`
//       import orbs_client

//       address = orbs_client.Address(${this.senderPublicKey}, ${this.virtualChainId}, ${this.networkId})
//       client = orbs_client.HttpClient(${this.apiEndpoint}, address, ${this.timeoutInMillis})
//       contract = orbs_client.Contract(client, ${this.contractName})`.catch(rethrow);

//     return python;
//   }

//   async sendTransaction(methodName: string, args: OrbsContractMethodArgs): Promise<SendTransactionOutput> {

//     const python = await this.createPython();
//     const result = await python`contract.send_transaction(${methodName}, ${args})`;
//     await python.end();

//     return result;
//   }

//   async call(methodName: string, args: OrbsContractMethodArgs): Promise<any> {
//     const python = await this.createPython();
//     const result = await python`contract.call(${methodName}, ${args})`;
//     await python.end();

//     return result;
//   }

// }

// TODO: we do not need to use this mock server, we need to use the one that comes with public api - it is still a WIP
// let httpServer: Server;
before((done) => {
  // httpServer = mockHttpServer(expectedSendTransactionRequest, expectedCallContractRequest, expectedGetTransactionStatusRequest).listen(HTTP_PORT, done);
  done();
});

describe("The Javascript SDK", () => {
  const keyPairStub = stubObject<ED25519Key>(new ED25519Key(), ["sign"]);
  keyPairStub.publicKey = SENDER_PUBLIC_KEY;
  (<sinon.SinonStub>keyPairStub.sign).returns(Buffer.from(SIGNATURE, "hex"));

  const client = new OrbsClient(API_ENDPOINT, SENDER_ADDRESS, keyPairStub, TIMEOUT);
  const contract = new OrbsContract(client, CONTRACT_NAME);
  testContract(() => new TypeScriptContractAdapter(contract, CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS));
});

describe("The Java SDK", () => {
  testContract(() => new JavaContractAdapter(
    createJavaOrbsContract(CONTRACT_NAME, API_ENDPOINT, SENDER_PUBLIC_KEY, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID, TIMEOUT), CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS),
    { disableSignatureTest: true } // TODO: re-enable as soon as it's implemented
  );
});

describe.skip("The Python SDK", () => {
  // testContract(() => new PythonContractAdapter(CONTRACT_NAME, API_ENDPOINT, SENDER_PUBLIC_KEY, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID, TIMEOUT));
});

after((done) => {
  // httpServer.close(done);
  done();
});
