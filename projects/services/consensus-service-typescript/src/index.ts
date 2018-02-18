import { ErrorHandler, config, topology } from "orbs-core-library";
import consensusServer from "./consensus-server";

ErrorHandler.setup();

const nodeTopology = topology();

consensusServer(config, nodeTopology)
  .onEndpoint(nodeTopology.endpoint)
  .start();
