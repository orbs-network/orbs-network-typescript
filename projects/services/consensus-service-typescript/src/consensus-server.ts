import { defaults, toLower } from "lodash";
import { grpcServer, types, topologyPeers, logger, BaseConsensusConfig, ElectionTimeoutConfig, KeyManager, Consensus, SubscriptionManager, PendingTransactionPool, CommittedTransactionPool, TransactionValidator, SubscriptionProfiles, StartupCheckRunner } from "orbs-core-library";
import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";
import TransactionPoolService from "./transaction-pool-service";
// import * as shell from "shelljs";
import * as path from "path";

class DefaultConsensusConfig implements BaseConsensusConfig {
  electionTimeout: ElectionTimeoutConfig;
  heartbeatInterval: number;
  acceptableUnsyncedNodes: number;
  nodeName: string;
  clusterSize: number;
  signBlocks: boolean;
  keyManager?: KeyManager;
  consensusKeyManager: KeyManager;
  algorithm: string;
  leaderNodeName?: string;
  blockBuilderPollInterval?: number;
  msgLimit?: number;
  blockSizeLimit?: number;
  blockSizeMin?: number;
  leaderIntervalMs?: number;
  debug?: boolean;

  constructor(min?: number, max?: number, heartbeat?: number) {
    this.electionTimeout = { min: min || 2000, max: max || 4000 };
    this.heartbeatInterval = heartbeat || 100;
    this.algorithm = "benchmark";
  }
}

function makeConsensus(peers: types.ClientMap, consensusConfig: BaseConsensusConfig) {
  return new Consensus(consensusConfig, peers.gossip, peers.virtualMachine, peers.blockStorage, peers.transactionPool);
}

function makeSubscriptionManager(peers: types.ClientMap, ethereumContractAddress: string, subscriptionProfiles: SubscriptionProfiles) {
  const subscriptionManagerConfig = { ethereumContractAddress, subscriptionProfiles };
  return new SubscriptionManager(peers.sidechainConnector, subscriptionManagerConfig);
}

function makePendingTransactionPool(peers: types.ClientMap, transactionLifespanMs: number, verifySignature: boolean, verifySubscription: boolean) {
  const transactionValidator = new TransactionValidator(peers.subscriptionManager, { verifySignature, verifySubscription });
  return new PendingTransactionPool(peers.gossip, transactionValidator, { transactionLifespanMs });
}

function makeCommittedTransactionPool() {
  return new CommittedTransactionPool();
}

function parseSubscriptionProfiles(subscriptionProfileJson: string) {
  try {
    return JSON.parse(subscriptionProfileJson);
  } catch (err) {
    logger.error(`Bad subscription profile setting: ${subscriptionProfileJson} of type ${typeof subscriptionProfileJson}. Defaulting to empty list of profiles`);
    return {};
  }
}

export default function (nodeTopology: any, env: any) {
  const { NODE_NAME, NUM_OF_NODES, ETHEREUM_CONTRACT_ADDRESS, BLOCK_BUILDER_POLL_INTERVAL, MSG_LIMIT, BLOCK_SIZE_LIMIT, BLOCK_SIZE_MIN, LEADER_SYNC_INTERVAL,
    MIN_ELECTION_TIMEOUT, MAX_ELECTION_TIMEOUT, HEARBEAT_INTERVAL, TRANSACTION_EXPIRATION_TIMEOUT, CONSENSUS_ALGORITHM, CONSENSUS_LEADER_NODE_NAME,
    CONSENSUS_SIGN_BLOCKS, DEBUG_BENCHMARK, VERIFY_TRANSACTION_SIGNATURES, VERIFY_SUBSCRIPTION, SUBSCRIPTION_PROFILES, GENERATE_KEYS } = env;

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
  consensusConfig.signBlocks = toLower(CONSENSUS_SIGN_BLOCKS) === "true";
  consensusConfig.signBlocks ? new KeyManager({
    privateKeyPath: "/opt/orbs/private-keys/block/secret-key"
  }) : undefined;

  consensusConfig.blockBuilderPollInterval = Number(BLOCK_BUILDER_POLL_INTERVAL) || 500;
  consensusConfig.msgLimit = Number(MSG_LIMIT) || 4000000;
  consensusConfig.blockSizeLimit = Number(BLOCK_SIZE_LIMIT) || Math.floor(consensusConfig.msgLimit / (2 * 250));
  consensusConfig.blockSizeMin = Number(BLOCK_SIZE_MIN) || 0;
  consensusConfig.leaderIntervalMs = Number(LEADER_SYNC_INTERVAL) || 100;
  consensusConfig.debug = toLower(DEBUG_BENCHMARK) === "true";


  if (CONSENSUS_ALGORITHM) {
    consensusConfig.algorithm = CONSENSUS_ALGORITHM;
  }
  if (consensusConfig.algorithm.toLowerCase() === "stub") {
    if (!CONSENSUS_LEADER_NODE_NAME) {
      throw new Error("CONSENSUS_LEADER_NODE_NAME can't be missing from stub consensus!");
    }
    consensusConfig.leaderNodeName = CONSENSUS_LEADER_NODE_NAME;
    consensusConfig.heartbeatInterval = 1000; // this is the block interval
    consensusConfig.acceptableUnsyncedNodes = 1; // this is the number of nodes that can be out of sync before stopping the consensus
  }

  if (GENERATE_KEYS) {
    consensusConfig.consensusKeyManager = new KeyManager({
      nodeName: NODE_NAME,
      privateKeyPath: "/opt/orbs/e2e/config/docker/private-keys/consensus",
      publicKeysPath: "/opt/orbs/e2e/config/docker/public-keys/consensus",
    });
  }

  const nodeConfig = { nodeName: NODE_NAME };
  const peers = topologyPeers(nodeTopology.peers);

  const subscriptionProfiles = parseSubscriptionProfiles(SUBSCRIPTION_PROFILES);
  const verifySignature = toLower(VERIFY_TRANSACTION_SIGNATURES) === "true";
  const verifySubscription = toLower(VERIFY_SUBSCRIPTION) === "true";

  const consensusService = new ConsensusService(makeConsensus(peers, consensusConfig), nodeConfig);
  const subscriptionManagerService = new SubscriptionManagerService(makeSubscriptionManager(peers, ETHEREUM_CONTRACT_ADDRESS, subscriptionProfiles), nodeConfig);
  const transactionPoolService = new TransactionPoolService(makePendingTransactionPool(peers, transactionLifespanMs, verifySignature, verifySubscription), makeCommittedTransactionPool(), nodeConfig);
  const startupCheckRunner = new StartupCheckRunner("consensus-service", [consensusService, subscriptionManagerService, transactionPoolService]);

  return grpcServer.builder()
    .withService("Consensus", consensusService)
    .withService("SubscriptionManager", subscriptionManagerService)
    .withService("TransactionPool", transactionPoolService)
    .withStartupCheckRunner(startupCheckRunner)
    .withManagementPort(8081);
}
