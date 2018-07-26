import { NetworkCommunication } from "pbft-typescript";
import { PBFTKeyManager } from "./keyManger";
import { types } from "../../common-library/types";
import { logger } from "../../common-library/logger";

export type SubscriptionsCB = (messageType: string, payload: any) => void;

export interface RemoteListener {
  onRemoteMessage(messageType: string, message: any): void;
}

export class PBFTNetwork implements NetworkCommunication, RemoteListener {

  private totalSubscriptions: number = 0;
  private subscriptions: Map<number, SubscriptionsCB> = new Map();
  private membersPKs: string[];

  public constructor(
    private readonly clusterSize: number,
    private readonly keyManager: PBFTKeyManager,
    private readonly gossip: types.GossipClient
  ) {
    this.membersPKs = this.keyManager.getPublicKeys().slice(0, this.clusterSize);
    // for (let i = 0; i < this.membersPKs.length; i++) {
    //   this.membersPKs[i] = this.keyManager.getPublicKeyName(this.membersPKs[i]);
    // }
  }

  public getMembersPKs(seed: number): string[] {
    // return this.keyManager.getPublicKeys();
    return this.membersPKs;
  }

  public sendToMembers(publicKeys: string[], messageType: string, message: any): void {
    // const nodeNames: string[] = [];
    // for (let i = 0; i < publicKeys.length; i++) {
    //   nodeNames[i] = this.keyManager.getPublicKeyName(publicKeys[i]);
    // }
    const nodeNames: string[] = publicKeys;
    logger.info(`PBFTNetwork: sendToMembers: ${JSON.stringify(nodeNames)}  messageType: ${messageType}  message: ${JSON.stringify(message)}`);
    if (!publicKeys)
        return;
    for (let i = 0; i < publicKeys.length; i++) {
      this.gossip.unicastMessage({
        recipient: publicKeys[i], // this.keyManager.getPublicKeyName(publicKeys[i]),
        broadcastGroup: "consensus",
        messageType: messageType,
        buffer: new Buffer(JSON.stringify(message)),
        immediate: true
      });
    }
  }

  public async onRemoteMessage(messageType: string, message: any): Promise <any> {
    this.subscriptions.forEach(cb => {
      cb(messageType, message);
    });
  }


  public subscribeToMessages(cb: SubscriptionsCB): number {
    this.totalSubscriptions++;
    this.subscriptions.set(this.totalSubscriptions, cb);
    return this.totalSubscriptions;
  }


  public unsubscribeFromMessages(subscription: number): void {
    this.subscriptions.delete(subscription);
  }


  public dispose(): any {
    this.subscriptions.clear();
  }

  public isMember(publicKey: string): boolean {
    // return this.keyManager.hasPublicKey(publicKey);
    return this.membersPKs.indexOf(publicKey) > -1;
  }

}
