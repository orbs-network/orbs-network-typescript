
const CryptoSdk = require("bindings")("cryptosdk");

export interface Address {
  toString(): string;
}

export const Address: {
  new(param: string): Address
} = CryptoSdk.Address;
