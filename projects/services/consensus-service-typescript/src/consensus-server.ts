import { defaults } from "lodash";

import { grpcServer, types, topologyPeers, logger } from "orbs-core-library";
import { Consensus, SubscriptionManager, PendingTransactionPool, CommittedTransactionPool, TransactionValidator } from "orbs-core-library";

import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";
import TransactionPoolService from "./transaction-pool-service";

const DEFAULT_CONSENSUS_CONFIG = {
  electionTimeout: {
    min: 2000,
    max: 4000
  },
  heartbeatInterval: 100,
};

const { NODE_NAME, NUM_OF_NODES, ETHEREUM_CONTRACT_ADDRESS } = process.env;

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

if (!NUM_OF_NODES) {
  throw new Error("NUM_OF_NODES can't be 0!");
}

function makeConsensus(peers: types.ClientMap) {
  const consensusConfig = defaults({ nodeName: NODE_NAME, clusterSize: Number(NUM_OF_NODES) }, DEFAULT_CONSENSUS_CONFIG);

  return new Consensus(consensusConfig, peers.gossip, peers.virtualMachine, peers.blockStorage, peers.transactionPool);
}

function makeSubscriptionManager(peers: types.ClientMap) {
  const subscriptionManagerConfiguration = { ethereumContractAddress: ETHEREUM_CONTRACT_ADDRESS };

  if (!subscriptionManagerConfiguration.ethereumContractAddress) {
    logger.error("ethereumContractAddress wasn't provided! SubscriptionManager is disabled!");

    return;
  }

  return new SubscriptionManager(peers.sidechainConnector, subscriptionManagerConfiguration);
}

function makePendingTransactionPool(peers: types.ClientMap) {
  const transactionValidator = new TransactionValidator(peers.subscriptionManager);
  return new PendingTransactionPool(peers.gossip, transactionValidator);
}

function makeCommittedTransactionPool() {
  return new CommittedTransactionPool();
}

export default function(nodeTopology: any) {
  const nodeConfig = { nodeName: NODE_NAME };
  const peers = topologyPeers(nodeTopology.peers);

  return grpcServer.builder()
    .withService("Consensus", new ConsensusService(makeConsensus(peers), nodeConfig))
    .withService("SubscriptionManager", new SubscriptionManagerService(makeSubscriptionManager(peers), nodeConfig))
    .withService("TransactionPool", new TransactionPoolService(makePendingTransactionPool(peers), makeCommittedTransactionPool(), nodeConfig));
}
