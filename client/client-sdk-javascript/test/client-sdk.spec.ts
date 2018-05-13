import { expect, assert } from "chai";
import  * as chai from "chai";
import { Address } from "../src/address";
import { ED25519Key } from "../src/ed25519key";
import { OrbsClient } from "../src";
import * as sinonChai from "sinon-chai";
import { stubInterface, stubObject } from "ts-sinon";
import * as crypto from "crypto";
import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest, OrbsAPIGetTransactionStatusRequest } from "../src/orbs-api-interface";
import { OrbsContract, OrbsContractMethodArgs } from "../src/orbs-contract";
import * as path from "path";
import { testContract, OrbsContractAdapter } from "../../client-contract-test/src";
import { SENDER_ADDRESS, CONTRACT_NAME, CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS, SENDER_PUBLIC_KEY, SIGNATURE } from "../../client-contract-test/src/expected-results";

chai.use(sinonChai);

const API_ENDPOINT = "";
const TIMEOUT = 20;



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

describe("The Javascript SDK", () => {
  const keyPairStub = stubObject<ED25519Key>(new ED25519Key(), ["sign"]);
  keyPairStub.publicKey = SENDER_PUBLIC_KEY;
  (<sinon.SinonStub>keyPairStub.sign).returns(Buffer.from(SIGNATURE, "hex"));

  const client = new OrbsClient(API_ENDPOINT, SENDER_ADDRESS, keyPairStub, TIMEOUT);
  const contract = new OrbsContract(client, CONTRACT_NAME);

  testContract(() => new TypeScriptContractAdapter(contract, CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS));
});
