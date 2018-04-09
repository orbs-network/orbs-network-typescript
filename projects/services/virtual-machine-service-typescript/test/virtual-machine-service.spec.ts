import * as chai from "chai";
import * as mocha from "mocha";
import * as _ from "lodash";
import * as getPort from "get-port";

import { types, grpc, GRPCServerBuilder, Service, ServiceConfig } from "orbs-core-library";
import VirtualMachineServer from "../src/server";

const { expect } = chai;

class StubStorageServer extends Service implements types.StateStorageServer {
  state: { [id: string]: string };

  constructor(nodeConfig: ServiceConfig, keyMap: { [id: string]: string }) {
    super(nodeConfig);
    this.state = keyMap;
  }

  initialize(): Promise<void> {
    return Promise.resolve();
  }
  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  @Service.RPCMethod
  readKeys(rpc: types.ReadKeysContext): void {
    rpc.res = { values: _.pick(this.state, rpc.req.keys)};
  }
}

describe("vm service tests", () => {
    let server: GRPCServerBuilder;
    let endpoint: string;

    before(async () => {
      endpoint = `127.0.0.1:${await getPort()}`;

      const topology =  {
                  peers: [
                    {
                      service: "storage",
                      endpoint,
                    },
                  ],
                };

      const SMART_CONTRACTS_TO_LOAD = JSON.stringify([{address: "peon", filename: "foobar-smart-contract"}]);
      const NODE_NAME = "tester";
      const vmEnv = { NODE_NAME, SMART_CONTRACTS_TO_LOAD };
      const stubStorageServiceConfig = {nodeName: NODE_NAME};
      const stubStorageState = { "balances.account1": "10", "balances.account2": "0" };

      server = VirtualMachineServer(topology, vmEnv)
        .withService("StateStorage", new StubStorageServer(stubStorageServiceConfig, stubStorageState))
        .onEndpoint(endpoint);
      server.start();
    });

    it("should-load-contract-from-service", async () => {
      const senderAddress: types.UniversalAddress = {
        id: new Buffer("account1"),
        scheme: 0,
        checksum: 0,
        networkId: 0
      };

      const payload = JSON.stringify({
        method: "getMyBalance",
        args: []
      });

      const client = grpc.virtualMachineClient({ endpoint });
      const result = await client.callContract({
          sender: senderAddress,
          contractAddress: {address: "peon"},
          payload: payload  // if payload is not a json string this ends poorly
      });

      expect(result.resultJson).to.equal("10");
    });

    after(async () => {
      server.stop();
    });
});