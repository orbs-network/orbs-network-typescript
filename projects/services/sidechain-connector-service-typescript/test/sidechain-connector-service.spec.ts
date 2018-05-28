import * as mocha from "mocha";
import * as chai from "chai";
import { stubInterface } from "ts-sinon";
import * as request from "supertest";
import * as getPort from "get-port";

import { types, ErrorHandler, GRPCServerBuilder, grpc, logger, Service } from "orbs-core-library";
import { SidechainConnectorClient, EthereumFunctionParameter } from "orbs-interfaces";
import sidechainConnectorServer from "../src/server";
import createEthSimulator from "./ethereum-driver";
import { EthereumSimulator } from "./ethereum-driver";
import { STARTUP_STATUS, StartupStatus } from "../../../libs/core-library-typescript/src/common-library/startup-status";

const { expect } = chai;
logger.configure({ level: "debug" });

describe("sidechain connector service tests", function () {
  const SERVER_IP_ADDRESS = "127.0.0.1";
  this.timeout(10000);
  let server: GRPCServerBuilder;
  let client: SidechainConnectorClient;
  let ethSim: EthereumSimulator;
  let managementPort: number;

  before(async () => {
    const sidechainEndpoint = `${SERVER_IP_ADDRESS}:${await getPort()}`;
    managementPort = await getPort();
    const ethSimPort = await getPort();

    const topology = {
      peers: <string[]>[],
    };

    const NODE_NAME = "tester";
    const ETHEREUM_NODE_HTTP_ADDRESS = `http://${SERVER_IP_ADDRESS}:${ethSimPort}`;
    const sccEnv = { NODE_NAME, ETHEREUM_NODE_HTTP_ADDRESS };

    ethSim = await createEthSimulator(ethSimPort);
    logger.debug(`Simulator online on endpoint: ${ETHEREUM_NODE_HTTP_ADDRESS}`);

    server = sidechainConnectorServer(topology, sccEnv)
      .withManagementPort(managementPort)
      .onEndpoint(sidechainEndpoint);

    client = grpc.sidechainConnectorClient({ endpoint: sidechainEndpoint });

    return server.start();
  });

  it("should call etherneum contract via service", async () => {
    const ethFuncInterface = {
      name: "getValues",
      inputs: <EthereumFunctionParameter[]>[],
      outputs: [
        { name: "intValue", type: "uint256" },
        { name: "stringValue", type: "string" }
      ]
    };
    const res = await client.callEthereumContract({
      contractAddress: ethSim.contractAddress,
      functionInterface: ethFuncInterface,
      parameters: <string[]>[]
    });
    const truth = ethSim.getStoredDataFromMemory();
    const resultData = JSON.parse(res.resultJson);
    expect(resultData).to.ownProperty("intValue", truth.intValue.toString());
    expect(resultData).to.ownProperty("stringValue", truth.stringValue);
    expect(res).to.ownProperty("blockNumber");
    expect(res).to.ownProperty("timestamp");
    const now = Date.now() / 1000;
    // test should take about 2 second from contract creation above, checking 100 (just need it to be recent)
    expect(res.timestamp).to.be.gt(now - 100);
    expect(res.timestamp).to.be.lt(now + 10);
  });

  it("should return HTTP 200 and status ok when calling GET /admin/startupCheck on sidechain connector service (happy path)", async () => {

    const expected: StartupStatus = {
      name: "sidechain-connector-service",
      status: STARTUP_STATUS.OK,
      services: [
        { name: "sidechain-connector", status: STARTUP_STATUS.OK }
      ]
    };

    return request(`http://${SERVER_IP_ADDRESS}:${managementPort}`)
      .get("/admin/startupCheck")
      .expect(200, expected);
  });


  after(async () => {
    ethSim.close();
    return server.stop();
  });
});
