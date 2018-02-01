"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const orbs_common_library_1 = require("orbs-common-library");
const bind_decorator_1 = require("bind-decorator");
const erc_billing_contract_proxy_1 = require("./erc-billing-contract-proxy");
class SusbcriptionManagerServiceConfiguration {
}
class SusbcriptionManagerService {
    constructor(config) {
        this.config = config;
        orbs_common_library_1.logger.info(`${orbs_common_library_1.topology.name}: service started`);
        orbs_common_library_1.logger.debug(`${orbs_common_library_1.topology.name}: configuration = ${JSON.stringify(this.config)}`);
        setTimeout(() => this.main(), 2000);
    }
    // rpc interface
    getHeartbeat(rpc) {
        return __awaiter(this, void 0, void 0, function* () {
            orbs_common_library_1.logger.info(`${orbs_common_library_1.topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
            rpc.res = { responderName: orbs_common_library_1.topology.name, responderVersion: orbs_common_library_1.topology.version };
        });
    }
    // service logic
    askForHeartbeat(peer) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield peer.getHeartbeat({ requesterName: orbs_common_library_1.topology.name, requesterVersion: orbs_common_library_1.topology.version });
            orbs_common_library_1.logger.info(`${orbs_common_library_1.topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
        });
    }
    getSubscriptionStatus(rpc) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, tokens } = yield this.contractProxy.getSubscription(rpc.req.subscriptionKey);
            rpc.res = { active: tokens.isGreaterThan(0), expiryTimestamp: Date.now() + 24 * 60 * 1000 };
        });
    }
    askForHeartbeats() {
    }
    main() {
        return __awaiter(this, void 0, void 0, function* () {
            this.peers = orbs_common_library_1.topologyPeers(orbs_common_library_1.topology.peers);
            this.contractProxy = new erc_billing_contract_proxy_1.default(this.peers.sidechainConnector, this.config.ethereumContractAddress);
            setInterval(() => this.askForHeartbeats(), 5000);
        });
    }
}
__decorate([
    bind_decorator_1.default
], SusbcriptionManagerService.prototype, "getHeartbeat", null);
__decorate([
    bind_decorator_1.default
], SusbcriptionManagerService.prototype, "getSubscriptionStatus", null);
exports.default = SusbcriptionManagerService;
//# sourceMappingURL=service.js.map