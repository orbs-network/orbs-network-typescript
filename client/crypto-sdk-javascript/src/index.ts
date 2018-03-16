
const CryptoSdk = require("bindings")("cryptosdk");

export interface Address {
  version: number;
  accountId: string;
  checksum: string;

  toString(): string;
}

export const Address: {
  new(param: string): Address
} = CryptoSdk.Address;
