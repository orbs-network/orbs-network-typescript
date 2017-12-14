import Timer = NodeJS.Timer;
import TimeoutError from "./timeoutError";
import * as fs from "fs";
import * as assert from "assert";
import * as path from "path";

const ursa = require("ursa");
const crypto = require("crypto");

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

type PemFile = string;
type PrivateKey = any;
type PublicKey = any;

export class CryptoUtils {
  private privateKey: PrivateKey;
  private nodePublicKeys: Map<string, PublicKey> = new Map();
  private myName: string;

  constructor(nodeKey?: any, networkKeys?: any) {
    if (nodeKey === undefined && networkKeys === undefined) {
      const configDir = `${path.dirname(process.argv[2])}/config`;
      const privateKey: PemFile = fs.readFileSync(`${configDir}/private-key`, "utf8");

      this.myName = fs.readFileSync(`${configDir}/name`, "utf8").trim();
      this.privateKey = ursa.createPrivateKey(privateKey);
      for (const node of fs.readdirSync(`${configDir}/network`)) {
        const nodeKey: PemFile = fs.readFileSync(`${configDir}/network/${node}`, "utf8");
        this.nodePublicKeys.set(node, ursa.createPublicKey(nodeKey));
      }
      if (! this.nodePublicKeys.has(this.myName)) {
        this.nodePublicKeys.set(this.myName, ursa.createPublicKey(this.privateKey.toPublicPem()));
      }

      assert(ursa.matchingPublicKeys(this.privateKey, this.nodePublicKeys.get(this.myName)));
    }
  }

  public verifySignature(signer: string, data: Buffer | string, signature: string): boolean {
    const publicKey: PublicKey = this.nodePublicKeys.get(signer);
    if (! publicKey) {
      return false;
    }
    const dataBuf: Buffer = (typeof(data) === "string") ? new Buffer(data, "utf8") : data;
    return publicKey.hashAndVerify("SHA256", dataBuf, signature, "base64");
  }

  public sign(data: Buffer | string): string {
    const dataBuf: Buffer = (typeof(data) === "string") ? new Buffer(data, "utf8") : data;
    const signature = this.privateKey.hashAndSign("SHA256", dataBuf, undefined, "base64");
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
}