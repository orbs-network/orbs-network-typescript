/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import createMockServer from "./mock-server";
import * as args from "args";

args
  .option("port", "HTTP Port to listen on")
  .option("stubs", "JSON representing RequestStub[]");

const flags = args.parse(process.argv);

if (flags.port && flags.stubs) {

  createMockServer(JSON.parse(flags.stubs))
    .then(server => server.listen(flags.port, () => console.log(`started on port ${flags.port}`)))
    .catch(error => console.log(`server failed to start, got error: ${error}`));

} else {
  console.log(args.showHelp());
}

