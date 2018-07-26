import { KeyManager } from "..";
import { types } from "../common-library";

export interface ElectionTimeoutConfig {
  min: number;
  max: number;
}

export interface BaseConsensusConfig {
  nodeName: string;
  clusterSize: number;
  electionTimeout: ElectionTimeoutConfig;
  heartbeatInterval: number;
  acceptableUnsyncedNodes: number;
  algorithm: string;
  leaderNodeName?: string; // only if known (required for stub algorithm)
  blockBuilderPollInterval?: number;
  msgLimit?: number;
  blockSizeLimit?: number;
  debug?: boolean;
  signBlocks: boolean;
  keyManager?: KeyManager;
  consensusKeyManager?: KeyManager;
  leaderIntervalMs?: number;
}

export abstract class BaseConsensus {

  abstract async onMessageReceived(fromAddress: string, messageType: string, message: any): Promise<any>;

  // abstract async onBlockAdded(block: types.Block): Promise<any>;

  abstract async initialize(): Promise<any>;

  abstract async shutdown(): Promise<any>;
}
