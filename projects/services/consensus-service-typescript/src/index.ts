import { logger, ErrorHandler, topology } from "orbs-core-library";
import consensusServer from "./consensus-server";

ErrorHandler.setup();

const { LOGZIO_API_KEY } = process.env;

logger.configure({
  file: {
    fileName: __dirname + "../../../../logs/consensus.log"
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
});

const nodeTopology = topology();

consensusServer(nodeTopology)
  .onEndpoint(nodeTopology.endpoint)
  .start();
