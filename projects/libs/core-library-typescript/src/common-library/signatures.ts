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

  public constructor(signaturesConfig: SignaturesConfig) {
    this.config = signaturesConfig;
  }

  private getKey(path: string) {
    const rawKey = fs.readFileSync(path).toString();
    return rawKey;
  }

  private signObject(object: any, key: string): any {
    const sign = crypto.createSign("sha256");
    sign.update(stringify(object));

    const signature = sign.sign(key, "hex");
    const signendObject: any = _.clone(object);
    signendObject.signature = signature;

    return signendObject;
  }

  private verifyObject(object: any, publicKey: string): boolean {
    const { signature } = object;
    const payload = stringify(_.omit(object, "signature"));

    const verify = crypto.createVerify("sha256");
    verify.update(payload);

    return verify.verify(publicKey, signature, "hex");
  }

  private getPublicKey(path: string, keyName: string): string {
    if (!keyName.match(/[a-zA-Z-_0-9]/)) {
      throw new Error(`Bad public key name: ${keyName}`);
    }

    return this.getKey(`${path}/${keyName}`);
  }

  public signMessage(object: any) {
    const privateKey = this.getKey(this.config.message.privateKeyPath);
    return this.signObject(object, privateKey);
  }

  public verifyMessage(object: any, publicKeyName: string) {
    const publicKey = this.getPublicKey(this.config.message.publicKeysPath, publicKeyName);
    return this.verifyObject(object, publicKey);
  }
}
