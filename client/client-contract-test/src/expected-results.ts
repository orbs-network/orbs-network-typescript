import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest, OrbsAPIGetTransactionStatusRequest } from "../../client-sdk-javascript/src/orbs-api-interface";
import { OrbsContractMethodArgs } from "../../client-sdk-javascript/src/orbs-contract";
import { Address } from "../../client-sdk-javascript/src/address";
import * as crypto from "crypto";


export const VIRTUAL_CHAIN_ID = "640ed3";
export const CONTRACT_NAME = "contractName";
export const CONTRACT_METHOD_NAME = "method";
export const CONTRACT_METHOD_ARGS: OrbsContractMethodArgs = ["some-string", 3];
export const SIGNATURE = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
export const SENDER_PUBLIC_KEY = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
export const SENDER_ADDRESS = new Address(SENDER_PUBLIC_KEY, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);
export const TXID = "ada0838c9a4c86625d665cc6f2d617efa15a184e434ce1d1ee66f6e057fd0ae8";


export function expectedContractAddressBase58(contractName: string) {
    const contractKey = crypto.createHash("sha256").update(contractName).digest("hex");
    const contractAddress = new Address(contractKey, VIRTUAL_CHAIN_ID, Address.TEST_NETWORK_ID);

    return contractAddress.toString();
}

export function expectedPayload(methodName: string, args: OrbsContractMethodArgs) {
    return JSON.stringify({
        method: methodName,
        args: args
    });
}

export const expectedSendTransactionRequest: OrbsAPISendTransactionRequest = {
    header: {
        version: 0,
        senderAddressBase58: SENDER_ADDRESS.toString(),
        timestamp: Date.now().toString(),
        contractAddressBase58: expectedContractAddressBase58(CONTRACT_NAME)
    },
    payload: expectedPayload(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS),
    signatureData: {
      publicKeyHex: SENDER_PUBLIC_KEY,
      signatureHex: SIGNATURE
    }
};


export const expectedCallContractRequest: OrbsAPICallContractRequest = {
    contractAddressBase58: expectedContractAddressBase58(CONTRACT_NAME),
    senderAddressBase58: SENDER_ADDRESS.toString(),
    payload: expectedPayload(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)
};

export const expectedGetTransactionStatusRequest: OrbsAPIGetTransactionStatusRequest = {
    txid: TXID
};
