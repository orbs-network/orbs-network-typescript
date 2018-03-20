
const CryptoSDK = require("bindings")("cryptosdk");

export interface Address {
  networkId: number;
  version: number;
  virtualChainId: string;
  accountId: string;
  checksum: string;

  toString(): string;
}

export const Address: {
  new(publicKey: string, virtualChainId: string, networkId: string): Address
} = CryptoSDK.Address;
