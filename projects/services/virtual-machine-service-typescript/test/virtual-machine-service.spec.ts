import * as chai from "chai";
import * as mocha from "mocha";
import * as _ from "lodash";
import * as getPort from "get-port";
import * as request from "supertest";

import { types, grpc, GRPCServerBuilder, Service, ServiceConfig, Address, StartupStatus, STARTUP_STATUS } from "orbs-core-library";
import virtualMachineServer from "../src/server";
import { createHash } from "crypto";

const { expect } = chai;

const SERVER_IP_ADDRESS = "127.0.0.1";
const SMART_CONTRACT_NAME = "peon";
const SMART_CONTRACT_VCHAIN = "010101";
const SMART_CONTRACT_ADDRESS = Address.createContractAddress(SMART_CONTRACT_NAME, SMART_CONTRACT_VCHAIN);
const ACCOUNT1 = new Address(createHash("sha256").update("account1").digest());
const ACCOUNT2 = new Address(createHash("sha256").update("account2").digest());

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
    rpc.res = { values: _.pick(this.state, rpc.req.keys) };
  }
}


function buildCallRequest(account: Address, contractAddress: Address) {
  const payload = JSON.stringify({
    method: "getMyBalance",
    args: []
  });

  return {
    sender: account.toBuffer(),
    contractAddress: contractAddress.toBuffer(),
    payload: payload
  };
}

function accountBalanceKey(account: Address) {
  return `balances.${account.toBase58()}`;
}

describe("vm service tests", () => {
  let server: GRPCServerBuilder;
  let client: types.VirtualMachineClient;
  let storageServer: StubStorageServer;
  let managementPort: number;

  before(async () => {
    const endpoint = `${SERVER_IP_ADDRESS}:${await getPort()}`;

    const topology = {
      peers: [
        {
          service: "storage",
          endpoint,
        },
      ],
    };

    const SMART_CONTRACTS_TO_LOAD = JSON.stringify([{ vchainId: SMART_CONTRACT_VCHAIN, name: SMART_CONTRACT_NAME, filename: "foobar-smart-contract" }]);
    const NODE_NAME = "tester";
    const vmEnv = { NODE_NAME, SMART_CONTRACTS_TO_LOAD };
    const stubStorageServiceConfig = { nodeName: NODE_NAME };
    const stubStorageState = { [accountBalanceKey(ACCOUNT1)]: "10", [accountBalanceKey(ACCOUNT2)]: "0" };
    managementPort = await getPort();

    storageServer = new StubStorageServer(stubStorageServiceConfig, stubStorageState);
    server = virtualMachineServer(topology, vmEnv)
      .withService("StateStorage", storageServer)
      .withManagementPort(managementPort)
      .onEndpoint(endpoint);

    client = grpc.virtualMachineClient({ endpoint });

    // this ensures tests will run after the service is up
    return server.start();
  });

  it("should load contract from service", async () => {
    storageServer.givenState({ [accountBalanceKey(ACCOUNT1)]: "10", [accountBalanceKey(ACCOUNT2)]: "0" });
    const result = await client.callContract(buildCallRequest(ACCOUNT1, SMART_CONTRACT_ADDRESS));
    expect(result.resultJson).to.equal("10");
  });

  after(async () => {
    return server.stop();
  });

  it("should return HTTP 200 and status ok when calling GET /admin/startupCheck on virtual machine service (happy path)", async () => {

    const expected: StartupStatus = {
      name: "virtual-machine-service",
      status: STARTUP_STATUS.OK,
      services: [
        { name: "virtual-machine", status: STARTUP_STATUS.OK }
      ]
    };

    return request(`http://${SERVER_IP_ADDRESS}:${managementPort}`)
      .get("/admin/startupCheck")
      .expect(200, expected);
  });

});
