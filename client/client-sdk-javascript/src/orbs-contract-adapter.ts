import { OrbsClientSession } from ".";
import { SendTransactionOutput } from "orbs-interfaces";

export type OrbsContractMethodArgs = [string | number] | any[];

export class OrbsContractAdapter {
  orbsSession: OrbsClientSession;
  contractAddress: string;

  constructor(orbsSession: OrbsClientSession, contractAddress: string) {
    this.orbsSession = orbsSession;
    this.contractAddress = contractAddress;
  }

  public async sendTransaction(methodName: string, args: OrbsContractMethodArgs): Promise<SendTransactionOutput> {
    const payload = JSON.stringify({
      method: methodName,
      args: args
    });
    return await this.orbsSession.sendTransaction(this.contractAddress, payload);
  }

  public async call(methodName: string, args: OrbsContractMethodArgs) {
    const payload = JSON.stringify({
      method: methodName,
      args: args
    });
    return this.orbsSession.call(this.contractAddress, payload);
  }
}
