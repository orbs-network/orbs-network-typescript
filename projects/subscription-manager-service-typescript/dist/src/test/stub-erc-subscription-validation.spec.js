"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { Assertion, expect } = require("chai");
const Web3 = require("web3");
const ganache = require("ganache-core");
const path = require("path");
const solc = require("solc");
const child_process = require("child_process");
const bluebird_1 = require("bluebird");
const grpc_1 = require("orbs-common-library/src/grpc");
const ACTIVE_SUBSCRIPTION_ID = "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebe";
const INACTIVE_SUBSCRIPTION_ID = "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebd";
function deployOrbsStubContract(web3, minTokensForSubscription) {
    return __awaiter(this, void 0, void 0, function* () {
        const STUD_ORBS_TOKEN_SOLIDITY_CONTRACT = `
    pragma solidity 0.4.18;

    contract stubOrbsToken  {
        struct Subscription {
            bytes32 id;
            uint256 tokens;
        }
        bytes32 activeSubscriptionId;

        uint256 minTokensForSubscription;

        function stubOrbsToken(uint256 _minTokensForSubscription, bytes32 _activeSubscriptionId) public {
            minTokensForSubscription = _minTokensForSubscription;
            activeSubscriptionId = _activeSubscriptionId;
        }

        function getSubscriptionData(bytes32 _id) public view returns (bytes32 id, uint256 tokens) {
            id = _id;
            if(id == activeSubscriptionId) {
                tokens = minTokensForSubscription;
            } else {
                tokens = 0;
            }
        }
    }
    `;
        // compile contract
        const output = solc.compile(STUD_ORBS_TOKEN_SOLIDITY_CONTRACT, 1);
        if (output.errors)
            throw output.errors;
        const bytecode = output.contracts[":stubOrbsToken"].bytecode;
        const abi = JSON.parse(output.contracts[":stubOrbsToken"].interface);
        // deploy contract
        const contract = new web3.eth.Contract(abi, { data: "0x" + bytecode });
        const tx = contract.deploy({ arguments: [minTokensForSubscription, ACTIVE_SUBSCRIPTION_ID] });
        const account = (yield web3.eth.getAccounts())[0];
        const deployedContract = yield tx.send({
            from: account,
            gas: yield tx.estimateGas()
        });
        return deployedContract.options.address;
    });
}
class OrbsService {
    constructor(topologyPath) {
        this.topologyPath = topologyPath;
    }
    start(opts = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.context) {
                throw "already running";
            }
            this.context = this.run(opts);
            // TODO: wait by polling service state (not implemented yet in the server-side)
            yield bluebird_1.delay(7000);
        });
    }
    run(args = {}, streamStdout = true) {
        const topology = require(this.topologyPath);
        const projectPath = path.resolve(__dirname, "../../..", topology.project);
        const absoluteTopologyPath = path.resolve(__dirname, this.topologyPath);
        const process = child_process.exec(`node dist/index.js ${absoluteTopologyPath}`, {
            async: true,
            cwd: projectPath,
            env: Object.assign({}, args, { NODE_ENV: "test" }) // TODO: passing args in env var due a bug in nconf.argv used by the services
        });
        if (streamStdout) {
            process.stdout.on("data", console.log);
        }
        return { process, topology };
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.context.process.kill();
            this.context = undefined;
        });
    }
}
class OrbsSubscriptionManager extends OrbsService {
    getClient() {
        return grpc_1.grpc.subscriptionManagerClient({ endpoint: this.context.topology.endpoint });
    }
    start(opts) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            return _super("start").call(this, opts);
        });
    }
}
class OrbsSidechainConnector extends OrbsService {
    getClient() {
        return grpc_1.grpc.subscriptionManagerClient({ endpoint: this.context.topology.endpoint });
    }
    start(opts) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            return _super("start").call(this, opts);
        });
    }
}
class EthereumSimulationNode {
    constructor() {
        this.server = ganache.server({ accounts: [{ balance: "300000000000000000000" }], total_accounts: 1 });
    }
    getWeb3Client() {
        return new Web3(new Web3.providers.HttpProvider(`http://localhost:${this.port}`));
    }
    start(port = 8545) {
        if (this.port != undefined) {
            throw "already running";
        }
        this.server.listen(port);
        this.port = port;
    }
    stop() {
        this.server.close();
    }
}
class TestEnvironment {
    constructor() {
        this.subscriptionManager = new OrbsSubscriptionManager("./topology/subscription-manager.json");
        this.sidechainConnector = new OrbsSidechainConnector("./topology/sidechain-connector.json");
        this.ethereumNode = new EthereumSimulationNode();
    }
}
describe("subscription manager.getSubscriptionStatus() on a stub Orbs Ethereum contract", () => {
    const testEnvironment = new TestEnvironment();
    let res;
    let client;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            yield testEnvironment.ethereumNode.start(8547);
            const ethereumContractAddress = yield deployOrbsStubContract(testEnvironment.ethereumNode.getWeb3Client(), 100);
            yield Promise.all([
                testEnvironment.sidechainConnector.start({ ethereumNodeAddress: `http://localhost:${testEnvironment.ethereumNode.port}` }),
                testEnvironment.subscriptionManager.start({ ethereumContractAddress })
            ]);
            client = testEnvironment.subscriptionManager.getClient();
        });
    });
    it("should return that subscription is active if enough tokens", () => __awaiter(this, void 0, void 0, function* () {
        res = yield client.getSubscriptionStatus({ subscriptionKey: ACTIVE_SUBSCRIPTION_ID });
        expect(res).to.have.property("active", true);
    }));
    it("should return that subscription is inactive if not enough tokens", () => __awaiter(this, void 0, void 0, function* () {
        res = yield client.getSubscriptionStatus({ subscriptionKey: INACTIVE_SUBSCRIPTION_ID });
        expect(res).to.have.property("active", false);
    }));
    after(() => {
        testEnvironment.subscriptionManager.stop();
        testEnvironment.sidechainConnector.stop();
        testEnvironment.ethereumNode.stop();
    });
});
//# sourceMappingURL=stub-erc-subscription-validation.spec.js.map