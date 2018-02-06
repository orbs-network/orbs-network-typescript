
import * as chai from "chai";
import * as path from "path";
import * as child_process from "child_process";
import { delay } from "bluebird";
import { grpc } from "orbs-common-library/src/grpc";
import { types } from "orbs-common-library/src/types";
import { EthereumSimulationNode } from "../testkit/ethereum-simulation-node";

const ACTIVE_SUBSCRIPTION_ID = "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebe";
const INACTIVE_SUBSCRIPTION_ID = "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebd";

chai.should();

interface OrbsServiceContext {
    topology: any;
    process: any;
}

class OrbsService {
    context: OrbsServiceContext;
    topologyPath: string;

    constructor(topologyPath: string) {
        this.topologyPath = topologyPath;
    }

    public async start(opts = {}) {
        if (this.context) {
            throw "already running";
        }
        this.context = this.run(opts);
        // TODO: wait by polling service state (not implemented yet in the server-side)
        await delay(7000);
    }

    private run(args = {}, streamStdout = true) {
        const topology = require(this.topologyPath);
        const projectPath = path.resolve(__dirname, "../../..", topology.project);
        const absoluteTopologyPath = path.resolve(__dirname, this.topologyPath);
        const process = child_process.exec(
            `node dist/index.js ${absoluteTopologyPath}`, {
                async: true,
                cwd: projectPath,
                env: {...args, ...{NODE_ENV: "test"}}  // TODO: passing args in env var due a bug in nconf.argv used by the services
            });
        if (streamStdout) {
            process.stdout.on("data", console.log);
        }
        return { process, topology };
    }

    public async stop() {
        this.context.process.kill();
        this.context = undefined;
    }
}

class OrbsSubscriptionManager extends OrbsService {
    public getClient() {
        return grpc.subscriptionManagerClient({ endpoint: this.context.topology.endpoint });
    }

    public async start(opts: {ethereumContractAddress: string}) {
        return super.start(opts);
    }
}

class OrbsSidechainConnector extends OrbsService {
    public getClient() {
        return grpc.subscriptionManagerClient({ endpoint: this.context.topology.endpoint });
    }

    public async start(opts: {ethereumNodeAddress: string}) {
        return super.start(opts);
    }
}

class TestEnvironment {
    public readonly subscriptionManager: OrbsSubscriptionManager;
    public readonly sidechainConnector: OrbsSidechainConnector;
    public readonly ethereumNode: EthereumSimulationNode;


    constructor() {
        this.subscriptionManager = new OrbsSubscriptionManager("./topology/subscription-manager.json");
        this.sidechainConnector = new OrbsSidechainConnector("./topology/sidechain-connector.json");
        this.ethereumNode = new EthereumSimulationNode();
    }

    async start() {
        await this.ethereumNode.start(8547);
        const ethereumContractAddress = await this.ethereumNode.deployOrbsStubContract(100, ACTIVE_SUBSCRIPTION_ID);
        await Promise.all([
            this.sidechainConnector.start({ethereumNodeAddress: `http://localhost:${this.ethereumNode.port}`}),
            this.subscriptionManager.start({ethereumContractAddress})
        ]);
    }

    stop() {
        this.subscriptionManager.stop();
        this.sidechainConnector.stop();
        this.ethereumNode.stop();
    }
}


describe("subscription manager.getSubscriptionStatus() on a stub Orbs Ethereum contract", () => {
    const testEnvironment = new TestEnvironment();
    let res;
    let client: types.SubscriptionManagerClient;
    before(async function() {
        this.timeout(15000);
        await testEnvironment.start();
        client = testEnvironment.subscriptionManager.getClient();
    });
    it("should return that subscription is active if enough tokens", async () => {
        res = await client.getSubscriptionStatus({ subscriptionKey: ACTIVE_SUBSCRIPTION_ID });
        res.should.have.property("active", true);
    });
    it("should return that subscription is inactive if not enough tokens", async () => {
        res = await client.getSubscriptionStatus({ subscriptionKey: INACTIVE_SUBSCRIPTION_ID });
        res.should.have.property("active", false);
    });

    after(() => {
        testEnvironment.stop();
    });
});
