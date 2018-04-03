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

export class Signatures {
  config: SignaturesConfig;
  SIGNATURE_FORMAT: crypto.HexBase64Latin1Encoding = "base64";
  SIGNATURE_TYPE = "sha256";

  private publicMessageKeys = new Map<string, string>();
  private privateMessageKey: string;

  public constructor(signaturesConfig: SignaturesConfig) {
    this.config = signaturesConfig;

    this.readPrivateMessageKey();
    this.readPublicMessageKeys();
  }

  private readPrivateMessageKey() {
    if (this.config.message && this.config.message.privateKeyPath) {
      this.privateMessageKey = fs.readFileSync(this.config.message.privateKeyPath).toString();
    }
  }

  private readPublicMessageKeys() {
    if (this.config.message && this.config.message.publicKeysPath) {
      fs.readdirSync(this.config.message.publicKeysPath).forEach((keyName) => {
        const contents = fs.readFileSync(`${this.config.message.publicKeysPath}/${keyName}`).toString();
        this.publicMessageKeys.set(keyName, contents);
      });
    }
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

  public signMessage(object: any): string {
    return this.signObject(object, this.privateMessageKey);
  }

  public verifyMessage(object: any, signature: string, publicKeyName: string): boolean {
    const publicKey = this.publicMessageKeys.get(publicKeyName);
    return this.verifyObject(object, signature, publicKey);
  }
}
