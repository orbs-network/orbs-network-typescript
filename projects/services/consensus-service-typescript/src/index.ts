import { ErrorHandler, grpc, config, ServiceRunner, topology, topologyPeers } from "orbs-core-library";
import { Consensus } from "orbs-core-library";

import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";
import TransactionPoolService from "./transaction-pool-service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: nodeTopology.name };

const consensusConfig = config.get("consensus");
if (!consensusConfig) {
  throw new Error("Couldn't find consensus configuration!");
}

const consensus = new Consensus(consensusConfig, peers.gossip, peers.virtualMachine, peers.blockStorage);

const main = async () => {
  await ServiceRunner.runMulti(grpc.consensusServiceServer, [
    new ConsensusService(consensus, nodeConfig),
    new SubscriptionManagerService(peers.sidechainConnector, nodeConfig),
    new TransactionPoolService(nodeConfig)
  ], nodeTopology.endpoint);
};

main();
