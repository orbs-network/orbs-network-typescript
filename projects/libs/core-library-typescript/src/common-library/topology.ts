/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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
