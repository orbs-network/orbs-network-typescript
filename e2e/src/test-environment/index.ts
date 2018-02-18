import TestComponent from "./test-component";
import TestSubnet from "./test-subnet";
import { OrbsNodeCluster, OrbsNodeDeployParams } from "./orbs-nodes";
import TestStack from "./test-stack";
import { EthereumSimulationNode } from "./ethereum-simulation-node";


interface TestEnvironmentOptions {
    connectFromHost: boolean;
    preExistingPublicApiSubnet: string;
}

export class TestEnvironment extends TestStack {
    readonly orbsNetwork: TestSubnet;
    readonly publicApiNetwork: TestSubnet;
    readonly nodeCluster: OrbsNodeCluster;
    readonly ethereumSimulationNode: EthereumSimulationNode;
    readonly opts: TestEnvironmentOptions;

    private started: boolean = false;

    public async start() {
        if (this.started) {
            return;
        }
        await this.startComponent(this.orbsNetwork);
        if (!this.opts.preExistingPublicApiSubnet) {
            await this.startComponent(this.publicApiNetwork);
        }
        await this.startComponent(this.ethereumSimulationNode);

        const contractAddress = await this.ethereumSimulationNode.deployOrbsStubContract(1000, "0x0213e3852b8afeb08929a0f448f2f693b0fc3ebe");
        this.nodeCluster.setOrbsSubscriptionContractAddress(contractAddress);
        await this.startComponent(this.nodeCluster);
        this.started = true;
    }

    public async stop() {
        await super.stop();
        this.started = false;
    }

    public getPublicApiClient() {
        // return a client that connects to the first node
        return this.nodeCluster.getAvailableClients(this.opts.connectFromHost)[0];
    }

    constructor(opts: TestEnvironmentOptions) {
        super();
        this.opts = opts;
        if (!opts.connectFromHost && !opts.preExistingPublicApiSubnet) {
            throw "preexisting public api network must be configured when not connected via host";
        }
        this.ethereumSimulationNode = new EthereumSimulationNode();
        this.orbsNetwork = new TestSubnet("orbs-network", "172.2.1");
        this.publicApiNetwork = new TestSubnet("public-api-external-network", opts.preExistingPublicApiSubnet || "172.2.2");
        this.nodeCluster = new OrbsNodeCluster({ numOfNodes: 6 , orbsNetwork: this.orbsNetwork, publicApiNetwork: this.publicApiNetwork});
    }
}
