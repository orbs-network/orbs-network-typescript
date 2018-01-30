
const {Assertion, expect} = require("chai");
const Web3 = require("web3");
const ganache = require("ganache-core");
const path = require("path");
const solc = require("solc");
const child_process = require("child_process");
import { delay } from "bluebird";
import { grpc } from "orbs-common-library/src/grpc";
import { types } from "orbs-common-library/src/types";

const ACTIVE_SUBSCRIPTION_ID = "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebe";
const INACTIVE_SUBSCRIPTION_ID = "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebd";

async function deployOrbsStubContract(web3: any, minTokensForSubscription: number) {
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
    const contract = new web3.eth.Contract(abi, {data: "0x" + bytecode});
    const tx = contract.deploy({arguments: [minTokensForSubscription, ACTIVE_SUBSCRIPTION_ID]});
    const account = (await web3.eth.getAccounts())[0];
    const deployedContract = await tx.send({
        from: account,
        gas: await tx.estimateGas()
    });
    return deployedContract.options.address;
}

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


class EthereumSimulationNode {
    server: any;
    port: number;

    constructor() {
        this.server = ganache.server({accounts: [{balance: "300000000000000000000"}], total_accounts: 1});
    }

    public getWeb3Client() {
        return new Web3(new Web3.providers.HttpProvider(`http://localhost:${this.port}`));
    }


    start(port: number = 8545) {
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
    public readonly subscriptionManager: OrbsSubscriptionManager;
    public readonly sidechainConnector: OrbsSidechainConnector;
    public readonly ethereumNode: EthereumSimulationNode;


    constructor() {
        this.subscriptionManager = new OrbsSubscriptionManager("./topology/subscription-manager.json");
        this.sidechainConnector = new OrbsSidechainConnector("./topology/sidechain-connector.json");
        this.ethereumNode = new EthereumSimulationNode();
    }
}


describe("subscription manager.getSubscriptionStatus() on a stub Orbs Ethereum contract", () => {
    const testEnvironment = new TestEnvironment();
    let res;
    let client: types.SubscriptionManagerClient;
    before(async function() {
        this.timeout(15000);
        await testEnvironment.ethereumNode.start(8547);
        const ethereumContractAddress = await deployOrbsStubContract(testEnvironment.ethereumNode.getWeb3Client(), 100);
        await Promise.all([
            testEnvironment.sidechainConnector.start({ethereumNodeAddress: `http://localhost:${testEnvironment.ethereumNode.port}`}),
            testEnvironment.subscriptionManager.start({ethereumContractAddress})
        ]);
        client = testEnvironment.subscriptionManager.getClient();
    });
    it("should return that subscription is active if enough tokens", async () => {
        res = await client.getSubscriptionStatus({ subscriptionKey: ACTIVE_SUBSCRIPTION_ID });
        expect(res).to.have.property("active", true);
    });
    it("should return that subscription is inactive if not enough tokens", async () => {
        res = await client.getSubscriptionStatus({ subscriptionKey: INACTIVE_SUBSCRIPTION_ID });
        expect(res).to.have.property("active", false);
    });

    after(() => {
        testEnvironment.subscriptionManager.stop();
        testEnvironment.sidechainConnector.stop();
        testEnvironment.ethereumNode.stop();
    });
});
