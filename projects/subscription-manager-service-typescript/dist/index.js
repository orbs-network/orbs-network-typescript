"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orbs_common_library_1 = require("orbs-common-library");
const service_1 = require("./service");
const server = orbs_common_library_1.grpc.subscriptionManagerServer({
    endpoint: orbs_common_library_1.topology.endpoint,
    service: new service_1.default({
        ethereumContractAddress: orbs_common_library_1.config.get("ethereumContractAddress")
    })
});
//# sourceMappingURL=index.js.map