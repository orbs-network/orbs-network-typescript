import * as crypto from "crypto";
import * as stringify from "json-stable-stringify";
import * as fs from "fs";
import * as _ from "lodash";

export interface SignaturesConfig {
  message?: {
    publicKeysPath?: string,
    privateKeyPath?: string
  };

  block?: {
    publicKeysPath?: string,
    privateKeyPath?: string
  };
}
export default class Signatures {
  config: SignaturesConfig;
  SIGNATURE_FORMAT: crypto.HexBase64Latin1Encoding = "base64";
  SIGNATURE_TYPE = "sha256";

  public constructor(signaturesConfig: SignaturesConfig) {
    this.config = signaturesConfig;
  }

  private getKey(path: string) {
    const rawKey = fs.readFileSync(path).toString();
    return rawKey;
  }

  private signObject(object: any, key: string): string {
    const sign = crypto.createSign(this.SIGNATURE_TYPE);
    const payload = _.isBuffer(object) ? object : stringify(object);
    sign.update(payload);

    return sign.sign(key, this.SIGNATURE_FORMAT);
  }

  private verifyObject(object: any, signature: string, publicKey: string): boolean {
    const payload = _.isBuffer(object) ? object : stringify(object);
    const verify = crypto.createVerify(this.SIGNATURE_TYPE);
    verify.update(payload);

    return verify.verify(publicKey, signature, this.SIGNATURE_FORMAT);
  }

  private getPublicKey(path: string, keyName: string): string {
    if (!keyName.match(/[a-zA-Z-_0-9]/)) {
      throw new Error(`Bad public key name: ${keyName}`);
    }

    return this.getKey(`${path}/${keyName}`);
  }

  public signMessage(object: any): string {
    const privateKey = this.getKey(this.config.message.privateKeyPath);
    return this.signObject(object, privateKey);
  }

  public verifyMessage(object: any, signature: string, publicKeyName: string): boolean {
    const publicKey = this.getPublicKey(this.config.message.publicKeysPath, publicKeyName);
    return this.verifyObject(object, signature, publicKey);
  }
}
