import Timer = NodeJS.Timer;
import TimeoutError from "./timeoutError";
import * as fs from "fs";
import * as assert from "assert";
import * as path from "path";
import * as config from "./config";
import { networkInterfaces } from "os";
import { logger } from "./logger";

const crypto = require("crypto");
const ec = require("secp256k1");
const base58 = require("bs58");
const os = require("os");

const GOSSIP_LEADER_IP = process.env.GOSSIP_LEADER_IP;
const NODE_IP = process.env.NODE_IP;

export class QuorumVerifier {
  private promise: Promise<Iterable<string>>;
  private cu: CryptoUtils;
  private signers: Set<string> = new Set();
  private requiredQuorum: number;
  private timeout: Timer;
  private isAwaited: boolean = false;
  private acceptFunction: (value: Iterable<string>) => void;
  private rejectFunction: (err: Error) => void;

  constructor(cu: CryptoUtils, requiredQuorum: number, timeoutMs: number) {
    this.promise = new Promise((accept: (value: Iterable<string>) => void, reject: (err: Error) => void) => {
      this.acceptFunction = accept;
      this.rejectFunction = reject;
    });
    this.cu = cu;
    this.requiredQuorum = requiredQuorum;
    this.timeout = setTimeout(() => this.timedOut(), timeoutMs);
  }

  get [Symbol.toStringTag]() {
    return "QuorumVerifier";
  }

  verify(value: Buffer | string, signer: string, signature: string): boolean {
    logger.debug("Verifying signature", signature);
    if (this.cu.verifySignature(signer, value, signature)) {
      logger.debug("Verified signature", signature);
      this.signers.add(signer);
      logger.debug(`Verified by ${this.signers.size} / ${this.requiredQuorum}`, signature);
      if (this.signers.size >= this.requiredQuorum) {
        clearTimeout(this.timeout);
        this.acceptFunction(this.signers.keys());
        return true;
      }
    }
    logger.debug(`Failed to verify signature ${signature} by ${signer}`);
    return false;
  }

  async awaitFirst(): Promise<Iterable<string>> {
    if (this.isAwaited) {
      return undefined;
    }
    this.isAwaited = true;
    return await this.promise;
  }

  private timedOut(): void {
    this.rejectFunction(new TimeoutError());
  }
}

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
        const leader = GOSSIP_LEADER_IP || fs.readFileSync(`${configDir}/leader`, "utf8").trim();
        const ip = NODE_IP || networkInterfaces()["eth0"].filter(iface => iface.family === "IPv4")[0].address;

        if (leader === ip) {
          logger.info(`Elected leader node1 at ${ip}`);
          return "node1";
        }
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

  public quorumVerifier(groupSizeFactor: number, constantOffset: number, timeoutMs: number): QuorumVerifier {
    const minQuorum = Math.ceil(this.nodePublicKeys.size  * groupSizeFactor + constantOffset);
    return new QuorumVerifier(this, minQuorum, timeoutMs);
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
