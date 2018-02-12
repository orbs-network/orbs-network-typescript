import { exec } from "shelljs";
import * as path from "path";
import TestComponent from "./test-component";
import TestNetwork from "./test-network";

const COMPOSE_CONFIG_PATH = path.join(__dirname, "../../..");
const NODE_CONFIG_PATH = path.resolve(path.join(__dirname, "../../../config/topologies/discovery/node1"));

export interface OrbsNodeDeployParams {
    nodeName: string;
    nodeOrbsNetworkIp: string;
    nodePublicApiIp: string;
    privateSubnet: string;
    forceRecreate?: boolean;
    gossipPeers: string[];
}

export class OrbsNode implements TestComponent {
    deployParams: OrbsNodeDeployParams;
    forceRecreate: boolean;

    constructor(deployParams: OrbsNodeDeployParams) {
        this.deployParams = deployParams;
    }

    public async start(): Promise<void> {
        let command = "up -d";
        if (this.deployParams.forceRecreate) {
            command += " --forceRecreate";
        }
        await this.runDockerCompose(command);
    }

    public async stop(): Promise<void> {
        await this.runDockerCompose("down");
    }

    private runDockerCompose(dockerComposeCommand: string) {
       return new Promise((resolve, reject) => {
           exec(`docker-compose -p orbs-${this.deployParams.nodeName} -f docker-compose.test.volumes.yml -f docker-compose.test.networks.yml -f docker-compose.test.services.yml ${dockerComposeCommand}`, {
            async: true,
            cwd: COMPOSE_CONFIG_PATH,
            env: {...process.env, ...{
                NODE_CONFIG_PATH : NODE_CONFIG_PATH,
                PRIVATE_NETWORK: this.deployParams.privateSubnet,
                NODE_NAME: this.deployParams.nodeName,
                NODE_IP: this.deployParams.nodeOrbsNetworkIp,
                PUBLIC_API_IP: this.deployParams.nodePublicApiIp,
                GOSSIP_PEERS: this.deployParams.gossipPeers
            }}}, (code: any, stdout: any, stderr: any) => {
                if (code == 0) {
                    resolve(stdout);
                } else {
                    reject(stderr);
                }
            });
        });
    }
}

export class OrbsNodeCluster implements TestComponent {
    orbsNetwork: TestNetwork;
    publicApiNetwork: TestNetwork;
    nodes: OrbsNode[];

    constructor(numOfNodes: number, orbsNetwork: TestNetwork, publicApiNetwork: TestNetwork) {
        this.orbsNetwork = orbsNetwork;
        this.publicApiNetwork = publicApiNetwork;
        this.nodes = this.generateNodeInstances(numOfNodes);
    }

    private generateNodeInstances(numOfNodes: number) {
        const gossipPeerIps = [];
        for (let i = 0; i < numOfNodes; i++) {
            gossipPeerIps.push(this.orbsNetwork.allocateAddress());
        }
        const gossipPeers = gossipPeerIps.map(ip => `ws://${ip}:60001`);
        const nodes: OrbsNode[] = [];
        for (let i = 0; i < numOfNodes; i++) {
            nodes.push(new OrbsNode({
                nodeName: `node${i + 1}`,
                nodeOrbsNetworkIp: gossipPeerIps[i],
                nodePublicApiIp: this.publicApiNetwork.allocateAddress(),
                gossipPeers,
                privateSubnet: `162.100.${i + 1}`
            }));
        }
        return nodes;
   }

   public async start() {
        await Promise.all(this.nodes.map(node => node.start()));
    }

    public async stop() {
        await Promise.all(this.nodes.map(node => node.stop()));
    }
}