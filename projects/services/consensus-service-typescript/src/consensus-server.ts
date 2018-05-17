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
  blockBuilderPollInterval?: number;
  msgLimit?: number;
  blockSizeLimit?: number;

  constructor(min?: number, max?: number, heartbeat?: number) {
    this.electionTimeout = { min: min || 2000, max: max || 4000 };
    this.heartbeatInterval = heartbeat || 100;
  }
}

function makeConsensus(peers: types.ClientMap, consensusConfig: RaftConsensusConfig) {
  return new Consensus(consensusConfig, peers.gossip, peers.virtualMachine, peers.blockStorage, peers.transactionPool);
}

function makeSubscriptionManager(peers: types.ClientMap, ethereumContractAddress: string) {
  const subscriptionManagerConfiguration = { ethereumContractAddress };
  return new SubscriptionManager(peers.sidechainConnector, subscriptionManagerConfiguration);
}

function makePendingTransactionPool(peers: types.ClientMap, transactionLifespanMs: number) {
  const transactionValidator = new TransactionValidator(peers.subscriptionManager);
  return new PendingTransactionPool(peers.gossip, transactionValidator, { transactionLifespanMs });
}

function makeCommittedTransactionPool() {
  return new CommittedTransactionPool();
}

export default function(nodeTopology: any, env: any) {
  const { NODE_NAME, NUM_OF_NODES, ETHEREUM_CONTRACT_ADDRESS, BLOCK_BUILDER_POLL_INTERVAL, MSG_LIMIT, BLOCK_SIZE_LIMIT,
    MIN_ELECTION_TIMEOUT, MAX_ELECTION_TIMEOUT, HEARBEAT_INTERVAL, TRANSACTION_EXPIRATION_TIMEOUT } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  if (!NUM_OF_NODES) {
    throw new Error("NUM_OF_NODES can't be 0!");
  }

  if (!ETHEREUM_CONTRACT_ADDRESS) {
    throw new Error("Must provide ETHEREUM_CONTRACT_ADDRESS");
  }

  const transactionLifespanMs = Number(TRANSACTION_EXPIRATION_TIMEOUT) || 30000;

  const consensusConfig = new DefaultConsensusConfig(Number(MIN_ELECTION_TIMEOUT), Number(MAX_ELECTION_TIMEOUT), Number(HEARBEAT_INTERVAL));
  consensusConfig.nodeName = NODE_NAME;
  consensusConfig.clusterSize = Number(NUM_OF_NODES);
  consensusConfig.blockBuilderPollInterval = Number(BLOCK_BUILDER_POLL_INTERVAL) || 500;
  consensusConfig.msgLimit = Number(MSG_LIMIT) || 4000000;
  consensusConfig.blockSizeLimit = Number(BLOCK_SIZE_LIMIT) || Math.floor(consensusConfig.msgLimit / (2 * 250));


  const nodeConfig = { nodeName: NODE_NAME };
  const peers = topologyPeers(nodeTopology.peers);

  return grpcServer.builder()
    .withService("Consensus", new ConsensusService(makeConsensus(peers, consensusConfig), nodeConfig))
    .withService("SubscriptionManager", new SubscriptionManagerService(makeSubscriptionManager(peers, ETHEREUM_CONTRACT_ADDRESS), nodeConfig))
    .withService("TransactionPool", new TransactionPoolService(makePendingTransactionPool(peers, transactionLifespanMs), makeCommittedTransactionPool(), nodeConfig));
}
