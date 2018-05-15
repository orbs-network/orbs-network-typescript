import { defaults } from "lodash";

import { grpcServer, types, topologyPeers, logger, RaftConsensusConfig, ElectionTimeoutConfig, KeyManager } from "orbs-core-library";
import { Consensus, SubscriptionManager, PendingTransactionPool, CommittedTransactionPool, TransactionValidator } from "orbs-core-library";
import * as _ from "lodash";


import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";
import TransactionPoolService from "./transaction-pool-service";

class DefaultConsensusConfig implements RaftConsensusConfig {
  electionTimeout: ElectionTimeoutConfig;
  heartbeatInterval: number;
  nodeName: string;
  clusterSize: number;
  signBlocks: boolean;
  keyManager?: KeyManager;

  constructor() {
    this.electionTimeout = { min: 2000, max: 4000};
    this.heartbeatInterval = 100;
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
  const { NODE_NAME, NUM_OF_NODES, ETHEREUM_CONTRACT_ADDRESS, CONSENSUS_SIGN_BLOCKS } = env;

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
  consensusConfig.signBlocks = _.lowerCase(CONSENSUS_SIGN_BLOCKS) === "true";
  consensusConfig.keyManager = consensusConfig.signBlocks ? new KeyManager({
    privateKeyPath: "/opt/orbs/private-keys/block/secret-key",
    publicKeysPath: "/opt/orbs/public-keys/block"
  }) : undefined;

  const nodeConfig = { nodeName: NODE_NAME };
  const peers = topologyPeers(nodeTopology.peers);

  return grpcServer.builder()
    .withService("Consensus", new ConsensusService(makeConsensus(peers, consensusConfig), nodeConfig))
    .withService("SubscriptionManager", new SubscriptionManagerService(makeSubscriptionManager(peers, ETHEREUM_CONTRACT_ADDRESS), nodeConfig))
    .withService("TransactionPool", new TransactionPoolService(makePendingTransactionPool(peers), makeCommittedTransactionPool(), nodeConfig));
}
