"use strict";
exports.__esModule = true;
var grpc_1 = require("./grpc");
function topologyPeers(topologyPeers) {
    var res = {};
    for (var _i = 0, topologyPeers_1 = topologyPeers; _i < topologyPeers_1.length; _i++) {
        var peer = topologyPeers_1[_i];
        switch (peer.service) {
            case "public-api": {
                res.publicApi = grpc_1.grpc.publicApiClient({ endpoint: peer.endpoint });
                break;
            }
            case "consensus": {
                res.consensus = grpc_1.grpc.consensusClient({ endpoint: peer.endpoint });
                break;
            }
            case "virtual-machine": {
                res.virtualMachine = grpc_1.grpc.virtualMachineClient({ endpoint: peer.endpoint });
                break;
            }
            case "storage": {
                res.storage = grpc_1.grpc.storageClient({ endpoint: peer.endpoint });
                break;
            }
            case "sidechain-connector": {
                res.sidechainConnector = grpc_1.grpc.sidechainConnectorClient({ endpoint: peer.endpoint });
                break;
            }
            default: {
                throw "Undefined peer service: " + peer.service;
            }
        }
    }
    return res;
}
exports.topologyPeers = topologyPeers;
