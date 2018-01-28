import { logger, topology, grpc, topologyPeers, types } from "orbs-common-library";
import bind from "bind-decorator";
import ERCBillingContractProxy from "./erc-billing-contract-proxy";

class SusbcriptionManagerServiceConfiguration {
  ethereumContractAddress?: string;
}
export default class SusbcriptionManagerService {

  peers: types.ClientMap;
  private contractProxy: ERCBillingContractProxy;
  config: SusbcriptionManagerServiceConfiguration;

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.info(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.info(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  @bind
  async getSubscriptionStatus(rpc: types.GetSubscriptionStatusContext) {
    const {id, tokens } = await this.contractProxy.getSubscription(rpc.req.subscriptionKey);
    rpc.res = { active: tokens.greaterThan(0), expiryTimestamp: Date.now() + 24 * 60 * 1000};
  }

  askForHeartbeats() {
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    this.contractProxy = new ERCBillingContractProxy(topologyPeers(topology.peers).sidechainConnector, this.config.ethereumContractAddress);
    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor(config: SusbcriptionManagerServiceConfiguration) {
    this.config = config;
    logger.info(`${topology.name}: service started`);
    logger.debug(`${topology.name}: configuration = ${JSON.stringify(this.config)}`);
    setTimeout(() => this.main(), 2000);
  }

}
