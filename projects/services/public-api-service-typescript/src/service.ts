import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, topology, grpc, types } from "orbs-common-library";

import { PublicApi } from "orbs-public-api-library";

export default class PublicApiService {
  private publicApi: PublicApi;

  // Public API RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

    @bind
    async sendTransaction(rpc: types.SendTransactionContext) {
      logger.debug(`${topology.name}: send transaction ${JSON.stringify(rpc.req)}`);

      await this.publicApi.sendTransaction(rpc.req);
    }

  @bind
  async call(rpc: types.CallContext) {
    const resultJson = await this.publicApi.callContract(rpc.req);

    logger.debug(`${topology.name}: called contract with ${JSON.stringify(rpc.req)}. result is: ${resultJson}`);

    rpc.res = {
      resultJson: resultJson
    };
  }

  async main() {
    logger.info(`${topology.name}: service started`);

    this.publicApi = new PublicApi();
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
