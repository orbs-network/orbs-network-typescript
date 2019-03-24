/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { KeyManager } from "..";

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
  leaderIntervalMs?: number;
}

export abstract class BaseConsensus {

  abstract async onMessageReceived(fromAddress: string, messageType: string, message: any): Promise<any>;

  abstract async initialize(): Promise<any>;

  abstract async shutdown(): Promise<any>;
}
