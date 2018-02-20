import { grpcServer, types, Config, topologyPeers, logger } from "orbs-core-library";
import { Consensus, SubscriptionManager, TransactionPool } from "orbs-core-library";

import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";
import TransactionPoolService from "./transaction-pool-service";

function makeConsensus(config: Config, peers: types.ClientMap) {
  const consensusConfig = config.get("consensus");
  if (!consensusConfig) {
    throw new Error("Couldn't find consensus configuration!");
  }

  return new Consensus(consensusConfig, peers.gossip, peers.virtualMachine, peers.blockStorage);
}

function makeSubscriptionManager(config: Config, peers: types.ClientMap) {
  const subscriptionManagerConfiguration = { ethereumContractAddress: config.get("ethereumContractAddress") };

  if (!subscriptionManagerConfiguration.ethereumContractAddress) {
    logger.error("ethereumContractAddress wasn't provided! SubscriptionManager is disabled!");

    return;
  }

  return new SubscriptionManager(peers.sidechainConnector, subscriptionManagerConfiguration);
}

export default function(config: Config, nodeTopology: any) {
  const nodeConfig = { nodeName: nodeTopology.name };
  const peers = topologyPeers(nodeTopology.peers);

  return grpcServer.builder()
    .withService("Consensus", new ConsensusService(makeConsensus(config, peers), nodeConfig))
    .withService("SubscriptionManager", new SubscriptionManagerService(makeSubscriptionManager(config, peers), nodeConfig))
    .withService("TransactionPool", new TransactionPoolService(new TransactionPool(), nodeConfig));
}
