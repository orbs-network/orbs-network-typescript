import * as path from "path";
import { logger, ErrorHandler, topology } from "orbs-core-library";
import consensusServer from "./consensus-server";

const { LOGZIO_API_KEY } = process.env;

ErrorHandler.setup();

logger.configure({
  file: {
    fileName: path.join(__dirname, "../../../../logs/consensus.log")
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
  console: true
});

const nodeTopology = topology();

consensusServer(nodeTopology)
  .onEndpoint(nodeTopology.endpoint)
  .start();
