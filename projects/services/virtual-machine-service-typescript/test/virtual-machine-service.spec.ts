import * as chai from "chai";
import * as mocha from "mocha";
import * as _ from "lodash";
import * as getPort from "get-port";

import { types, grpc, GRPCServerBuilder, Service, ServiceConfig } from "orbs-core-library";
import virtualMachineServer from "../src/server";
import { VirtualMachineClient } from "../../../libs/core-library-typescript/node_modules/orbs-interfaces";

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

  givenState(keyMap: { [id: string]: string }) {
    this.state = keyMap;
  }

  // if you get a decorator error here from VSC open the settings (cmd+,) and add "javascript.implicitProjectConfig.experimentalDecorators": true
  // either way it should not affect compilation because of the tsconfig.test.json
  @Service.RPCMethod
  readKeys(rpc: types.ReadKeysContext): void {
    rpc.res = { values: _.pick(this.state, rpc.req.keys)};
  }
}

function buildCallRequest(accountName: string, contractAddress: string) {
  const senderAddress: types.UniversalAddress = {
    id: new Buffer(accountName),
    scheme: 0,
    checksum: 0,
    networkId: 0
  };

  const payload = JSON.stringify({
    method: "getMyBalance",
    args: []
  });

  return {
    sender: senderAddress,
    contractAddress: {address: contractAddress},
    payload: payload
  };
}

describe("vm service tests", () => {
    let server: GRPCServerBuilder;
    let client: VirtualMachineClient;
    let storageServer: StubStorageServer;

    before(async () => {
      const endpoint = `127.0.0.1:${await getPort()}`;

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

      storageServer = new StubStorageServer(stubStorageServiceConfig, stubStorageState);
      server = virtualMachineServer(topology, vmEnv)
        .withService("StateStorage", storageServer)
        .onEndpoint(endpoint);

      client = grpc.virtualMachineClient({ endpoint });

      // this ensures tests will run after the service is up
      return server.start();
    });

    it("should load contract from service", async () => {
      storageServer.givenState({ "balances.account1": "10", "balances.account2": "0" });
      const result = await client.callContract(buildCallRequest("account1", "peon"));
      expect(result.resultJson).to.equal("10");
    });

    after(async () => {
      return server.stop();
    });
});