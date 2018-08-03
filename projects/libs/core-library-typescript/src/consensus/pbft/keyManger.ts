import { KeyManager } from "pbft-typescript";
import { KeyManager as KM } from "../../common-library/";
import { logger } from "../../common-library/logger";

export class PBFTKeyManager implements KeyManager  {

  public constructor(private readonly keyManager: KM, private readonly myNodeId: string) {
  }

  public verify(object: any, signature: string, publicKey: string): boolean {
    // return this.keyManager.verify(object, signature, this.keyManager.getPublicKeyName(publicKey));
    return this.keyManager.verify(object, signature, publicKey);
  }

  public getMyPublicKey(): string {
    // return this.keyManager.getPublicKey(this.myNodeId);
    return this.myNodeId;
  }

  public sign(object: any): string {
    logger.info(`PBFTKeyManager: signing object: ${JSON.stringify(object)} `);
    return this.keyManager.sign(object);
  }

  public getPublicKeys(): string[] {
    return this.keyManager.getPublicKeys();
  }

  public getPublicKeyName(publicKey: string) {
    return this.keyManager.getPublicKeyName(publicKey);
  }

  public hasPublicKey(publicKey: string): boolean {
    return this.keyManager.hasPublicKey(publicKey);
  }

}
