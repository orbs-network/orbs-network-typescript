import { logger, ErrorHandler, topology } from "orbs-core-library";
import consensusServer from "./consensus-server";

logger.configure({
  file: {
    fileName: __dirname + "../../../../logs/consensus.log"
  },
});

ErrorHandler.setup();

const nodeTopology = topology();

consensusServer(nodeTopology)
  .onEndpoint(nodeTopology.endpoint)
  .start();
