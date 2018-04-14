import { crc32 } from "crc";
import * as bs58 from "bs58";
import * as crypto from "crypto";

export class Address {
  readonly networkId: string;
  readonly virtualChainId: string;
  readonly publicKey: Buffer;
  readonly version: number = 0;
  readonly accountId: Buffer;
  readonly checksum: number;
  private fullAddress: Buffer;

  static readonly MAIN_NETWORK_ID = "14";
  static readonly TEST_NETWORK_ID = "1a";
  static readonly SYSTEM_VCHAINID = "000000";

  constructor(publicKey: Buffer, virtualChainId = Address.SYSTEM_VCHAINID, networkId = Address.TEST_NETWORK_ID) {
    this.networkId = networkId;
    this.virtualChainId = virtualChainId;
    this.publicKey = publicKey;
    this.accountId = this.calculateAccountId();
    this.fullAddress = this.generateFullAddressNoChecksum();
    this.checksum = crc32(this.fullAddress);
  }

  calculateAccountId() {
    const publicKeyHash = crypto.createHash("sha256").update(this.publicKey).digest();
    const accountId = crypto.createHash("ripemd160").update(publicKeyHash).digest();
    return accountId;
  }

  generateFullAddressNoChecksum() {
    const networkPart = Buffer.from(this.networkId, "hex");
    const versionPart = Buffer.alloc(1);
    versionPart.writeUInt8(this.version, 0);
    const vchainIdPart = Buffer.from(this.virtualChainId, "hex");
    return Buffer.concat([networkPart, versionPart, vchainIdPart, this.accountId]);
  }

  toBuffer() {
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(this.checksum, 0);
    return Buffer.concat([this.fullAddress, checksum]);
  }

  toBase58() {
    const rawAddress = this.toBuffer();
    return bs58EncodeRawAddress(rawAddress);
  }
}

export function createContractAddress(contractName: string, vchainId = Address.SYSTEM_VCHAINID) {
  const publicKey = crypto.createHash("sha256").update(contractName).digest();
  return new Address(publicKey, vchainId);
}

export function bs58EncodeRawAddress(rawAddress: Buffer) {
    // two first bytes encoded separately
    return bs58.encode(rawAddress.slice(0, 1))
    + bs58.encode(rawAddress.slice(1, 2))
    + bs58.encode(rawAddress.slice(2));
}

export function bs58DecodeRawAddress(base58Address: string) {
  return Buffer.concat([
    bs58.decode(base58Address.slice(0, 1)),
    bs58.decode(base58Address.slice(1, 2)),
    bs58.decode(base58Address.slice(2))]);
}

