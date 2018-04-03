const CryptoSDK = require("bindings")("cryptosdk");

export interface ED25519Key {
  publicKey: string;
}

export const ED25519Key: {
  new(publicKey?: string): ED25519Key
} = CryptoSDK.ED25519Key;
