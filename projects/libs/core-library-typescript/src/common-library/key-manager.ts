import * as crypto from "crypto";
import * as stringify from "json-stable-stringify";
import * as fs from "fs";
import * as _ from "lodash";

export interface KeyManagerConfig {
  publicKeysPath?: string;
  privateKeyPath?: string;
}

export class KeyManager {
  config: KeyManagerConfig;
  SIGNATURE_ENCODING: crypto.HexBase64Latin1Encoding = "base64";
  HASH_TYPE = "sha256";

  private publicKeys = new Map<string, string>();
  private privateKey: string;

  public constructor(signaturesConfig: KeyManagerConfig) {
    this.config = signaturesConfig;

    if (_.isEmpty(this.config.privateKeyPath) && _.isEmpty(this.config.publicKeysPath)) {
      throw new Error(`Neither private key nor public keys are provided!`);
    }

    this.readPrivateKey();
    this.readPublicKeys();
  }

  private readPrivateKey() {
    if (this.config.privateKeyPath) {
      this.privateKey = fs.readFileSync(this.config.privateKeyPath).toString();
    }
  }

  private readPublicKeys() {
    if (this.config.publicKeysPath) {
      fs.readdirSync(this.config.publicKeysPath).forEach((keyName) => {
        const contents = fs.readFileSync(`${this.config.publicKeysPath}/${keyName}`).toString();
        this.publicKeys.set(keyName, contents);
      });
    }
  }

  private signObject(object: any, privateKey: string): string {
    const sign = crypto.createSign(this.HASH_TYPE);
    const payload = _.isBuffer(object) ? object : stringify(object);
    sign.update(payload);

    return sign.sign(privateKey, this.SIGNATURE_ENCODING);
  }

  private verifyObject(object: any, signature: string, publicKey: string): boolean {
    const payload = _.isBuffer(object) ? object : stringify(object);
    const verify = crypto.createVerify(this.HASH_TYPE);
    verify.update(payload);

    return verify.verify(publicKey, signature, this.SIGNATURE_ENCODING);
  }

  public sign(object: any): string {
    if (!this.privateKey) {
      throw new Error(`Private key not found`);
    }

    return this.signObject(object, this.privateKey);
  }

  public verify(object: any, signature: string, publicKeyName: string): boolean {
    const publicKey = this.getPublicKey(publicKeyName);

    return this.verifyObject(object, signature, publicKey);
  }

  public getPublicKey(publicKeyName: string) {
    if (!this.publicKeys.has(publicKeyName)) {
      throw new Error(`No public key found: ${publicKeyName}`);
    }

    return this.publicKeys.get(publicKeyName);
  }
}
