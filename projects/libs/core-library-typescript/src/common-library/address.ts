import { crc32 } from "crc";
import * as bs58 from "bs58";
import * as crypto from "crypto";
import { logger } from ".";


export class Address {
  readonly networkId: string;
  readonly virtualChainId: string;
  readonly publicKey: Buffer;
  readonly version: number = 0;
  readonly accountId: Buffer;
  readonly checksum: number;
  private fullAddress: Buffer;

  static readonly MAIN_NETWORK_ID = "4d";
  static readonly TEST_NETWORK_ID = "54";
  static readonly SYSTEM_VCHAINID = "000000";

  constructor(
    publicKey?: Buffer,
    virtualChainId = Address.SYSTEM_VCHAINID,
    networkId = Address.TEST_NETWORK_ID,
    accountId?: Buffer
  ) {
    this.networkId = networkId;
    this.virtualChainId = virtualChainId;

    if (publicKey) {
      this.publicKey = publicKey;
      if (accountId != undefined) {
        throw new Error("either publicKey or accountId can be pre-set, but not both");
      }
      this.accountId = this.calculateAccountId();
    } else {
      if (accountId == undefined)
        throw new Error("publicId or accountId not defined. At least one of them must be defined");
      this.accountId = accountId;
    }
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

  static fromBuffer(rawAddress: Buffer, publicKey?: Buffer, validateChecksum = true): Address {
    const networkId = rawAddress.slice(0, 1).toString("hex");
    const version = rawAddress.readUInt8(1);
    const vchainId = rawAddress.slice(2, 5).toString("hex");
    const accountId = rawAddress.slice(5, 25);

    let address: Address;
    if (publicKey) {
      // if public key for given, we validate that it's mapped to the right account ID
      address = new Address(publicKey, vchainId, networkId);
      if (!address.accountId.equals(accountId)) {
        logger.info(`accountId in address and accountId derived by publicKey don't match ${accountId} != ${address.accountId}`);
        return undefined;
      }
    } else {
      address = new Address(undefined, vchainId, networkId, accountId);
    }

    if (validateChecksum) {
      const checksum = rawAddress.readUInt32BE(25);
      if (address.checksum != checksum) {
        logger.info(`checksum of raw address failed 0x${address.checksum.toString(16)}!=0x${checksum.toString(16)}`);
        return undefined;
      }
    }

    return address;
  }

  static createContractAddress(contractName: string, vchainId?: string, networkId?: string) {
    const publicKey = crypto.createHash("sha256").update(contractName).digest();
    return new Address(publicKey, vchainId, networkId);
  }
}

export function bs58EncodeRawAddress(rawAddress: Buffer): string {
  return rawAddress.slice(0, 1).toString("utf8") +
    rawAddress.slice(1, 2).toString("hex") +
    bs58.encode(rawAddress.slice(2));
}

export function bs58DecodeRawAddress(base58Address: string): Buffer {
  return Buffer.concat([
    Buffer.from(base58Address.slice(0, 1), "utf8"),
    Buffer.from(base58Address.slice(1, 3), "hex"),
    bs58.decode(base58Address.slice(3))]);
}
