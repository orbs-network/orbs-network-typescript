import TestComponent from "./test-component";
import TestNetwork from "./test-network";
import { OrbsNodeCluster } from "./orbs-nodes";

export default class AdHocTestNet {
    readonly orbsNetworkSubnetPrefix = "172.2.1";
    readonly publicApiNetworkSubnetPrefix = "172.2.2";
    private componentStack: TestComponent[] = [];


    private async startComponent(component: TestComponent) {
        await component.start();
        this.componentStack.push(component);
    }

    public async stop() {
        while (true) {
            const component = this.componentStack.pop();
            if (!component) {
                break;
            }
            await component.stop();
        }
    }

    public async start(numOfNodes: number = 6) {
        const orbsNetwork = new TestNetwork("orbs-network", this.orbsNetworkSubnetPrefix);
        await this.startComponent(orbsNetwork);
        const publicApiNetwork = new TestNetwork("public-api-external-network", this.publicApiNetworkSubnetPrefix);
        await this.startComponent(publicApiNetwork);
        const nodeCluster = new OrbsNodeCluster(6, orbsNetwork, publicApiNetwork);
        await this.startComponent(nodeCluster);
    }
}

async function sanityTest() {
    const testnet = new AdHocTestNet();
    try {
        await testnet.start();
        console.log("** STARTED **");
    } catch (err) {
        console.log("failed starting testnet. error: ", err);
    } finally {
        await testnet.stop();
        console.log("** STOPPED **");
    }
}

if (require.main === module) {
    sanityTest();
}