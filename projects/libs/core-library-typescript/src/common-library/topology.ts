import { logger } from "./logger";
import * as fs from "fs";

export const topology = () => {
  function showUsage() {
    logger.warn("Usage: node dist/index.js <topology-path>");
  }

  if (!process.argv[2]) {
    logger.error("topology not provided, exiting");
    showUsage();
    process.exit();
  }

  const filePath = process.argv[2];
  if (!fs.existsSync(filePath)) {
    logger.error(`topology with path '${filePath}' not found, exiting`);
    showUsage();
    process.exit();
  }

  return require(filePath);
};
