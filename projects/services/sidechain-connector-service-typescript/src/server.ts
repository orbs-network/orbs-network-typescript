import { grpcServer, StartupCheckRunner } from "orbs-core-library";
import SidechainConnectorService from "./service";


export default function (nodeTopology: any, env: any) {
  const { NODE_NAME, ETHEREUM_NODE_HTTP_ADDRESS } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  if (!ETHEREUM_NODE_HTTP_ADDRESS) {
    throw new Error("ETHEREUM_NODE_HTTP_ADDRESS can't be empty!");
  }

  const serviceConfig = { nodeName: NODE_NAME, ethereumNodeHttpAddress: ETHEREUM_NODE_HTTP_ADDRESS };
  const sidechainConnectorService = new SidechainConnectorService(serviceConfig);
  const startupCheckRunner = new StartupCheckRunner("sidechain-connector-service", [sidechainConnectorService]);

  return grpcServer.builder()
    .withStartupCheckRunner(startupCheckRunner)
    .withService("SidechainConnector", sidechainConnectorService);
}
