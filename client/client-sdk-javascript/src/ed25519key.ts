const CryptoSDK = require("bindings")("cryptosdk");

export interface ED25519Key {
  publicKey: string;
  hasPrivateKey: boolean;

  getPrivateKeyUnsafe(): string;
  sign(message: Buffer): Buffer;
  verify(message: Buffer, signature: Buffer): boolean;
}

export const ED25519Key: {
  new(publicKey?: string, privateKey?: string): ED25519Key;
} = CryptoSDK.ED25519Key;
