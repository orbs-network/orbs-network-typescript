/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as path from "path";

import { logger, ErrorHandler, topology, Service } from "orbs-core-library";

import consensusServer from "./consensus-server";

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/consensus.log"));

const nodeTopology = topology();

consensusServer(nodeTopology, process.env)
  .onEndpoint(nodeTopology.endpoint)
  .start();
