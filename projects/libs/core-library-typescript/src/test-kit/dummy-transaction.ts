import { types } from "../common-library/types";
import  { Address, createContractAddress } from "../common-library/address";
import { createHash } from "crypto";

export default function aDummyTransaction(timestamp?: number): types.Transaction {
  return {
    header: {
      version: 0,
      sender: new Address(createHash("sha256").update("dummyAccount").digest()).toBuffer(),
      timestamp: (timestamp == undefined ? Date.now() : timestamp).toString(),
      contractAddress: createContractAddress("dummyContract").toBuffer()
    },
    payload: "{}"
  };
}
