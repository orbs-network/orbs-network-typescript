/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as path from "path";

import { logger, ErrorHandler, Service, topology } from "orbs-core-library";
import storageServer from "./server";

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/storage.log"));

const nodeTopology = topology();

storageServer(nodeTopology, process.env)
  .onEndpoint(nodeTopology.endpoint)
  .start();