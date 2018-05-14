import { OrbsContractMethodArgs, Address } from "orbs-client-sdk";
import * as crypto from "crypto";
import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest, OrbsAPIGetTransactionStatusRequest } from "./orbs-api-interface";


export const VIRTUAL_CHAIN_ID = "640ed3";
export const CONTRACT_NAME = "contractName";
export const CONTRACT_METHOD_NAME = "method";
export const CONTRACT_METHOD_ARGS: OrbsContractMethodArgs = ["some-string", 3];
export const SENDER_PUBLIC_KEY = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b";
export const SENDER_PRIVATE_KEY = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";
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
    signatureData: undefined
};


export const expectedCallContractRequest: OrbsAPICallContractRequest = {
    contractAddressBase58: expectedContractAddressBase58(CONTRACT_NAME),
    senderAddressBase58: SENDER_ADDRESS.toString(),
    payload: expectedPayload(CONTRACT_METHOD_NAME, CONTRACT_METHOD_ARGS)
};

export const expectedGetTransactionStatusRequest: OrbsAPIGetTransactionStatusRequest = {
    txid: TXID
};
