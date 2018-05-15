import { defaults } from "lodash";

import { grpcServer, types, topologyPeers, logger, RaftConsensusConfig, ElectionTimeoutConfig } from "orbs-core-library";
import { Consensus, SubscriptionManager, PendingTransactionPool, CommittedTransactionPool, TransactionValidator } from "orbs-core-library";


import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";
import TransactionPoolService from "./transaction-pool-service";

class DefaultConsensusConfig implements RaftConsensusConfig {
  electionTimeout: ElectionTimeoutConfig;
  heartbeatInterval: number;
  nodeName: string;
  clusterSize: number;
  algorithm: string;
  leaderNodeName?: string;

  constructor() {
    this.electionTimeout = { min: 2000, max: 4000};
    this.heartbeatInterval = 100;
    this.algorithm = "raft";
  }
}

function makeConsensus(peers: types.ClientMap, consensusConfig: RaftConsensusConfig) {
  return new Consensus(consensusConfig, peers.gossip, peers.virtualMachine, peers.blockStorage, peers.transactionPool);
}

function makeSubscriptionManager(peers: types.ClientMap, ethereumContractAddress: string) {
  const subscriptionManagerConfiguration = { ethereumContractAddress };
  return new SubscriptionManager(peers.sidechainConnector, subscriptionManagerConfiguration);
}

function makePendingTransactionPool(peers: types.ClientMap) {
  const transactionValidator = new TransactionValidator(peers.subscriptionManager);
  return new PendingTransactionPool(peers.gossip, transactionValidator);
}

function makeCommittedTransactionPool() {
  return new CommittedTransactionPool();
}

export default function(nodeTopology: any, env: any) {
  const { NODE_NAME, NUM_OF_NODES, ETHEREUM_CONTRACT_ADDRESS, CONSENSUS_ALGORITHM, CONSENSUS_LEADER_NODE_NAME } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  if (!NUM_OF_NODES) {
    throw new Error("NUM_OF_NODES can't be 0!");
  }

  if (!ETHEREUM_CONTRACT_ADDRESS) {
    throw new Error("Must provide ETHEREUM_CONTRACT_ADDRESS");
  }

  const consensusConfig = new DefaultConsensusConfig();
  consensusConfig.nodeName = NODE_NAME;
  consensusConfig.clusterSize = Number(NUM_OF_NODES);

  if (CONSENSUS_ALGORITHM) {
    consensusConfig.algorithm = CONSENSUS_ALGORITHM;
  }
  if (consensusConfig.algorithm.toLowerCase() === "stub") {
    if (!CONSENSUS_LEADER_NODE_NAME) {
      throw new Error("CONSENSUS_LEADER_NODE_NAME can't be missing from stub consensus!");
    }
    consensusConfig.leaderNodeName = CONSENSUS_LEADER_NODE_NAME;
    consensusConfig.heartbeatInterval = 1000; // this is the block interval
  }

  const nodeConfig = { nodeName: NODE_NAME };
  const peers = topologyPeers(nodeTopology.peers);

  return grpcServer.builder()
    .withService("Consensus", new ConsensusService(makeConsensus(peers, consensusConfig), nodeConfig))
    .withService("SubscriptionManager", new SubscriptionManagerService(makeSubscriptionManager(peers, ETHEREUM_CONTRACT_ADDRESS), nodeConfig))
    .withService("TransactionPool", new TransactionPoolService(makePendingTransactionPool(peers), makeCommittedTransactionPool(), nodeConfig));
}
