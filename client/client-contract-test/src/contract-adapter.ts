import { OrbsAPISendTransactionRequest, OrbsAPICallContractRequest } from "./orbs-api-interface";
import { OrbsContractMethodArgs } from "../../client-sdk-javascript/src/orbs-contract";

export interface OrbsContractAdapter {
    contractMethodName: string;
    contractMethodArgs: OrbsContractMethodArgs;

    getSendTranscationObject(): Promise<OrbsAPISendTransactionRequest> ;
    getCallObject(): Promise<OrbsAPICallContractRequest> ;
}