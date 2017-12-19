import Timer = NodeJS.Timer;
import TimeoutError from "./timeoutError";
import * as fs from "fs";
import * as assert from "assert";
import * as path from "path";

const crypto = require("crypto");
const ec = require("secp256k1");
const base58 = require("bs58");

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
    if (this.cu.verifySignature(signer, value, signature)) {
      this.signers.add(signer);
      if (this.signers.size >= this.requiredQuorum) {
        clearTimeout(this.timeout);
        this.acceptFunction(this.signers.keys());
        return true;
      }
    }
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

  public static loadFromConfiguration(): CryptoUtils {
    const configDir = `${path.dirname(process.argv[2])}/config`;
    const privateKey: PrivateKey = base58.decode(fs.readFileSync(`${configDir}/test-private-key`, "utf8"));
    const myName: string = fs.readFileSync(`${configDir}/name`, "utf8").trim();
    const nodePublicKeys: Map<string, PublicKey> = new Map();

    for (const node of fs.readdirSync(`${configDir}/network`)) {
      const nodeKey: Buffer = base58.decode(fs.readFileSync(`${configDir}/network/${node}`, "utf8"));
      nodePublicKeys.set(node, nodeKey);
    }
    if (! nodePublicKeys.has(myName)) {
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
    const publicKey: PublicKey = this.nodePublicKeys.get(signer);
    if (! publicKey) {
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
}
