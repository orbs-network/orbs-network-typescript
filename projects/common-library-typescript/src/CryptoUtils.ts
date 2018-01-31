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

    assert(ec.publicKeyCreate(privateKey).equals(nodePublicKeys.get(myName)), `public key for node ${myName} should match private; ${base58.encode(privateKey)}->${base58.encode(ec.publicKeyCreate(privateKey))} != ${base58.encode(nodePublicKeys.get(myName))}`);
    return new CryptoUtils(privateKey, nodePublicKeys, myName);
  }

  public static initializeTestCrypto(nodeName: string): CryptoUtils {
    const hash = crypto.createHash("sha256");
    hash.update(nodeName);
    const privateKey: PrivateKey = hash.digest();
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
    const digest: Buffer = crypto.createHash("SHA256").update(dataBuf).digest();
    return ec.verify(digest, base58.decode(signature), publicKey);
  }

  public sign(data: Buffer | string): string {
    const dataBuf: Buffer = (typeof(data) === "string") ? new Buffer(data, "utf8") : data;
    const digest: Buffer = crypto.createHash("SHA256").update(dataBuf).digest();

    const signature: string = base58.encode(ec.sign(digest, this.privateKey).signature);
    assert(this.verifySignature(this.myName, dataBuf, signature));
    return signature;
  }

  public whoAmI(): string {
    return this.myName;
  }

  public shortHash(buf: Buffer | string): string {
    const hash = crypto.createHash("sha1");
    hash.update(buf);
    return hash.digest("base64");
  }

  public longHash(buf: Buffer | string): string {
    const hash = crypto.createHash("sha256");
    hash.update(buf);
    return hash.digest("base64");
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
