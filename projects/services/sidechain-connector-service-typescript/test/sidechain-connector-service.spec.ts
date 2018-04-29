import * as mocha from "mocha";
import * as chai from "chai";
import { stubInterface } from "ts-sinon";
import * as getPort from "get-port";

import { types, ErrorHandler, GRPCServerBuilder, grpc, logger, Service } from "orbs-core-library";
import { SidechainConnectorClient, EthereumFunctionParameter } from "orbs-interfaces";
import sidechainConnectorServer from "../src/server";
import createEthSimulator from "./ethereum-driver";
import { EthereumSimulator } from "./ethereum-driver";


const { expect } = chai;
logger.configure({ level: "debug" });

describe("sidechain connector service tests", function () {
    this.timeout(10000);
    let server: GRPCServerBuilder;
    let client: SidechainConnectorClient;
    let ethSim: EthereumSimulator;

    before(async () => {
        const sidechainEndpoint = `127.0.0.1:${await getPort()}`;
        const ethSimPort = await getPort();

        const topology =  {
            peers: <string[]>[],
        };

        const NODE_NAME = "tester";
        const ETHEREUM_NODE_HTTP_ADDRESS = `http://127.0.0.1:${ethSimPort}`;
        const sccEnv = { NODE_NAME, ETHEREUM_NODE_HTTP_ADDRESS };

        ethSim = await createEthSimulator(ethSimPort);
        logger.debug(`Simulator online on endpoint: ${ETHEREUM_NODE_HTTP_ADDRESS}`);

        server = sidechainConnectorServer(topology, sccEnv)
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
        const res = await client.callEthereumContract({ contractAddress: ethSim.contractAddress,
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

    after(async () => {
        ethSim.close();
        return server.stop();
    });
});