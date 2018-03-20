
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
  readonly MAIN_NETWORK_ID: string;
  readonly TEST_NETWORK_ID: string;

  new(publicKey: string, virtualChainId: string, networkId: string): Address
} = CryptoSDK.Address;
