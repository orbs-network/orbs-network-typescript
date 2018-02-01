import * as fs from "fs";
import * as assert from "assert";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import * as ec from "secp256k1";
import * as base58 from "bs58";

import { config } from "./config";
import { logger } from "./logger";

const NODE_IP = process.env.NODE_IP;
const NODE_NAME = process.env.NODE_NAME;

type PrivateKey = Buffer;
type PublicKey = Buffer;

export enum Encoding {
  NONE = 0,
  BASE64 = 1,
  HEX = 2,
}

export class CryptoUtils {
  private privateKey: PrivateKey;
  private nodePublicKeys: Map<string, PublicKey>;
  private myName: string;

  private constructor(privateKey: PrivateKey, nodePublicKeys: Map<string, PublicKey>, myName: string) {
    this.privateKey = privateKey;
    this.nodePublicKeys = new Map(nodePublicKeys);
    this.myName = myName;
  }

  public static getName(configDir: string) {
    try {
      return fs.readFileSync(`${configDir}/name`, "utf8").trim();
    } catch (e) {
      try {
        const name = NODE_NAME || NODE_IP || os.networkInterfaces()["eth0"].filter(iface => iface.family === "IPv4")[0].address;
        return name;
      } catch (e) {}

      return os.hostname();
    }
  }

  public static getPrivateKey(configDir: string) {
    return base58.decode(fs.readFileSync(`${configDir}/test-private-key`, "utf8"));
  }

  public static loadFromConfiguration(): CryptoUtils {
    const configDir = `${path.dirname(process.argv[2])}/config`;
    const privateKey: PrivateKey = this.getPrivateKey(configDir);
    const myName: string = this.getName(configDir);
    const nodePublicKeys: Map<string, PublicKey> = new Map();

    for (const node of fs.readdirSync(`${configDir}/network`)) {
      const nodeKey: Buffer = base58.decode(fs.readFileSync(`${configDir}/network/${node}`, "utf8"));
      nodePublicKeys.set(node, nodeKey);
    }

    // TODO remove dummy keys after we can exchange keys
    const dummyPubicKey = this.getDummyPublicKey(configDir);

    if (dummyPubicKey) {
      logger.warn("Using dummy public key", base58.encode(dummyPubicKey));
      nodePublicKeys.set("dummy", this.getDummyPublicKey(configDir));
      nodePublicKeys.set(myName, this.getDummyPublicKey(configDir));
    } else {
      nodePublicKeys.set(myName, ec.publicKeyCreate(privateKey));
    }

    const encodedPrivateKey = base58.encode(privateKey);
    const encodedPublicKey = base58.encode(ec.publicKeyCreate(privateKey));
    const encodedCurrentPublicKey = base58.encode(nodePublicKeys.get(myName));
    assert(ec.publicKeyCreate(privateKey).equals(nodePublicKeys.get(myName)), `public key for node ${myName} should ` +
      `match private; ${encodedPrivateKey}->${encodedPublicKey} != ${encodedCurrentPublicKey}`);

      return new CryptoUtils(privateKey, nodePublicKeys, myName);
  }

  public static initializeTestCrypto(nodeName: string): CryptoUtils {
    const privateKey: PrivateKey = <Buffer>CryptoUtils.sha256(nodeName);
    const nodePublicKeys: Map<string, PublicKey> = new Map();
    nodePublicKeys.set(nodeName, ec.publicKeyCreate(privateKey));
    return new CryptoUtils(privateKey, nodePublicKeys, nodeName);
  }

  public verifySignature(signer: string, data: Buffer | string, signature: string): boolean {
    // TODO remove dummy keys
    const publicKey: PublicKey = this.nodePublicKeys.get(signer) || this.nodePublicKeys.get("dummy");

    logger.debug(`Got public key ${base58.encode(publicKey)} for ${signer}`);

    if (!publicKey) {
      return false;
    }

    const dataBuf: Buffer = (typeof(data) === "string") ? new Buffer(data, "utf8") : data;
    const digest: Buffer = <Buffer>CryptoUtils.sha256(dataBuf);
    return ec.verify(digest, base58.decode(signature), publicKey);
  }

  public sign(data: Buffer | string): string {
    const dataBuf: Buffer = (typeof(data) === "string") ? new Buffer(data, "utf8") : data;
    const digest: Buffer = <Buffer>CryptoUtils.sha256(dataBuf);

    const signature: string = base58.encode(ec.sign(digest, this.privateKey).signature);
    assert(this.verifySignature(this.myName, dataBuf, signature));

    return signature;
  }

  public whoAmI(): string {
    return this.myName;
  }

  public static sha256(buf: Buffer | string, encoding: Encoding = Encoding.NONE): string | Buffer {
    const hash = crypto.createHash("sha256");
    hash.update(buf);

    let encodingOption;

    switch (encoding) {
      case Encoding.BASE64:
        encodingOption = "base64";
        break;

      case Encoding.HEX:
        encodingOption = "hex";
        break;

      default:
        encoding = undefined;
    }

    return hash.digest(encodingOption);
  }

  public getPublicKey(): string {
    return base58.encode(this.nodePublicKeys.get(this.myName));
  }

  public static getDummyPublicKey(configDir: string) {
    try {
      return base58.decode(fs.readFileSync(`${configDir}/test-public-key`, "utf8"));
    } catch (e) {
      return;
    }
  }
}
