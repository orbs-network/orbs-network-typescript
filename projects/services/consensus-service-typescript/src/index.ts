import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";
import TransactionPoolService from "./transaction-pool-service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: nodeTopology.name };

const main = async () => {
  await ServiceRunner.runMulti(grpc.consensusServiceServer, [
    new ConsensusService(peers.gossip, peers.virtualMachine, peers.blockStorage, nodeConfig),
    new SubscriptionManagerService(peers.sidechainConnector, nodeConfig),
    new TransactionPoolService(nodeConfig)
  ], nodeTopology.endpoint);
};

main();
