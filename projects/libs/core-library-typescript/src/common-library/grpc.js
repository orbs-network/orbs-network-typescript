"use strict";
exports.__esModule = true;
var path = require("path");
var Mali = require("mali");
var caller = require("grpc-caller");
var types_1 = require("./types");
var PROTO_PATH = path.resolve(__dirname, "../../../architecture/interfaces");
function client(proto, name, endpoint) {
    var protoPath = path.resolve(PROTO_PATH, proto);
    return caller(endpoint, protoPath, name);
}
function server(proto, name, endpoint, service) {
    var protoPath = path.resolve(PROTO_PATH, proto);
    var app = new Mali(protoPath, name);
    var serviceFuncs = {};
    for (var _i = 0, _a = types_1.types[name]; _i < _a.length; _i++) {
        var funcName = _a[_i];
        serviceFuncs[funcName] = (service)[funcName];
    }
    app.use(serviceFuncs);
    app.start(endpoint);
}
var grpc;
(function (grpc) {
    function storageServer(_a) {
        var endpoint = _a.endpoint, service = _a.service;
        return server("storage.proto", "Storage", endpoint, service);
    }
    grpc.storageServer = storageServer;
    function storageClient(_a) {
        var endpoint = _a.endpoint;
        return client("storage.proto", "Storage", endpoint);
    }
    grpc.storageClient = storageClient;
    function consensusServer(_a) {
        var endpoint = _a.endpoint, service = _a.service;
        server("consensus.proto", "Consensus", endpoint, service);
    }
    grpc.consensusServer = consensusServer;
    function consensusClient(_a) {
        var endpoint = _a.endpoint;
        return client("consensus.proto", "Consensus", endpoint);
    }
    grpc.consensusClient = consensusClient;
    function publicApiServer(_a) {
        var endpoint = _a.endpoint, service = _a.service;
        server("public-api.proto", "PublicApi", endpoint, service);
    }
    grpc.publicApiServer = publicApiServer;
    function virtualMachineServer(_a) {
        var endpoint = _a.endpoint, service = _a.service;
        server("virtual-machine.proto", "VirtualMachine", endpoint, service);
    }
    grpc.virtualMachineServer = virtualMachineServer;
    function sidechainConnectorServer(_a) {
        var endpoint = _a.endpoint, service = _a.service;
        server("sidechain-connector.proto", "SidechainConnector", endpoint, service);
    }
    grpc.sidechainConnectorServer = sidechainConnectorServer;
    function publicApiClient(_a) {
        var endpoint = _a.endpoint;
        return client("public-api.proto", "PublicApi", endpoint);
    }
    grpc.publicApiClient = publicApiClient;
    function virtualMachineClient(_a) {
        var endpoint = _a.endpoint;
        return client("virtual-machine.proto", "VirtualMachine", endpoint);
    }
    grpc.virtualMachineClient = virtualMachineClient;
    function sidechainConnectorClient(_a) {
        var endpoint = _a.endpoint;
        return client("sidechain-connector.proto", "SidechainConnector", endpoint);
    }
    grpc.sidechainConnectorClient = sidechainConnectorClient;
})(grpc = exports.grpc || (exports.grpc = {}));
