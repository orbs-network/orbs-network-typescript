export interface ElectionTimeoutConfig {
  min: number;
  max: number;
}

export interface RaftConsensusConfig {
  nodeName: string;
  clusterSize: number;
  electionTimeout: ElectionTimeoutConfig;
  heartbeatInterval: number;
}

export abstract class BaseConsensus {

  abstract async onMessageReceived(fromAddress: string, messageType: string, message: any): Promise<any>;

  abstract async initialize(): Promise<any>;

  abstract async shutdown(): Promise<any>;
}
