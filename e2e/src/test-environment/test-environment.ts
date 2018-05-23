import TestComponent from "./test-component";
import TestSubnet from "./test-subnet";
import { OrbsNodeCluster, OrbsNodeConfig } from "./orbs-nodes";
import TestStack from "./test-stack";
import EthereumSimulationNode from "./ethereum-simulation-node";


interface TestEnvironmentConfig {
    connectFromHost: boolean;
    preExistingPublicSubnet: string;
    testSubscriptionKey: string;
    numOfNodes: number;
    envFile: string;
}

export class TestEnvironment extends TestStack {
    readonly orbsNetwork: TestSubnet;
    readonly publicNetwork: TestSubnet;
    readonly nodeCluster: OrbsNodeCluster;
    readonly ethereumSimulationNode: EthereumSimulationNode;
    readonly config: TestEnvironmentConfig;
    readonly testSubscriptionProfile = "TEST_PROFILE";
    readonly minTokensForSubscription = 1000;

    private started: boolean = false;

    public async start() {
        if (this.started) {
            return;
        }
        await this.startComponent(this.orbsNetwork);
        if (!this.config.preExistingPublicSubnet) {
            await this.startComponent(this.publicNetwork);
        }
        await this.startComponent(this.ethereumSimulationNode);

        const contractAddress = await this.ethereumSimulationNode.deployOrbsStubContract(
          this.minTokensForSubscription,
          this.config.testSubscriptionKey,
          this.testSubscriptionProfile,
          this.config.connectFromHost
        );
        this.nodeCluster.setEthereumSubscriptionContractAddress(contractAddress);
        await this.startComponent(this.nodeCluster);
        this.started = true;
    }

    public async stop() {
        await super.stop();
        this.started = false;
    }

    public discoverApiEndpoint(): string {
        // return a client that connects to the first node
      return this.nodeCluster.getAvailableApiEndpoints(this.config.connectFromHost)[0];
    }

    constructor(config: TestEnvironmentConfig) {
        super();
        this.config = config;
        if (!config.connectFromHost && !config.preExistingPublicSubnet) {
            throw "A preexisting public api subnet must be configured when not connected via host.";
        }
        this.orbsNetwork = new TestSubnet("orbs-network", "172.2.1");
        this.publicNetwork = new TestSubnet("public-network", config.preExistingPublicSubnet || "172.2.2");
        this.ethereumSimulationNode = new EthereumSimulationNode({publicIp: this.publicNetwork.allocateAddress()});
        this.nodeCluster = new OrbsNodeCluster({
            numOfNodes: config.numOfNodes,
            orbsNetwork: this.orbsNetwork,
            publicApiNetwork: this.publicNetwork,
            ethereumNodeHttpAddress: this.ethereumSimulationNode.getPublicAddress(false),
            envFile: config.envFile,
            subscriptionConfig: {
              minTokensForSubscription: this.minTokensForSubscription,
              subscriptionProfile: this.testSubscriptionProfile
            }
        });
    }
}
