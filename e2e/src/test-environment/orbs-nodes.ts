import { exec } from "shelljs";
import * as path from "path";
import TestComponent from "./test-component";
import TestSubnet from "./test-subnet";
import { delay } from "bluebird";
import { initPublicApiClient } from "../public-api-client";


const DOCKER_CONFIG_PATH = path.resolve(path.join(__dirname, "../../config/docker"));
const NODE_CONFIG_PATH = "/opt/orbs/config/topologies/discovery/node1";

export interface OrbsNodeConfig {
    nodeName: string;
    nodeOrbsNetworkIp: string;
    nodePublicApiIp: string;
    privateSubnet: string;
    forceRecreate?: boolean;
    publicApiHostPort: number;
    sidechainConnectorPublicIp: string;
    gossipPeers: string[];
    ethereumNodeHttpAddress: string;
    ethereumSubscriptionContractAddress?: string;
    debugPort: number;
}

export class OrbsNode implements TestComponent {
    config: OrbsNodeConfig;
    forceRecreate: boolean;

    constructor(config: OrbsNodeConfig) {
        this.config = config;
    }

    public async start(): Promise<void> {
        let command = "up -d";
        if (this.config.forceRecreate) {
            command += " --forceRecreate";
        }
        await this.runDockerCompose(command);
        await delay(60000);
    }

    public async stop(): Promise<void> {
        await this.runDockerCompose("down");
    }

    public getPublicApiClient(accessFromHost: boolean) {
        const endpoint = accessFromHost ? `0.0.0.0:${this.config.publicApiHostPort}` : `${this.config.nodePublicApiIp}:51151`;
        return initPublicApiClient({ endpoint });
    }

    public setEthereumSubscriptionContractAddress(contractAddress: string) {
        this.config.ethereumSubscriptionContractAddress = contractAddress;
    }

    private runDockerCompose(dockerComposeCommand: string) {
        if (this.config.ethereumSubscriptionContractAddress == undefined) {
            throw "ethereumSubscriptionContractAddress must be defined";
        }
        return new Promise((resolve, reject) => {
            exec(`docker-compose -p orbs-test-${this.config.nodeName} -f docker-compose.test.volumes.yml -f docker-compose.test.networks.yml -f docker-compose.test.services.yml ${dockerComposeCommand}`, {
                async: true,
                cwd: DOCKER_CONFIG_PATH,
                env: {...process.env, ...{
                    NODE_CONFIG_PATH : NODE_CONFIG_PATH,
                    PRIVATE_NETWORK: this.config.privateSubnet,
                    NODE_NAME: this.config.nodeName,
                    NODE_IP: this.config.nodeOrbsNetworkIp,
                    PUBLIC_API_IP: this.config.nodePublicApiIp,
                    GOSSIP_PEERS: this.config.gossipPeers,
                    PUBLIC_API_HOST_PORT: this.config.publicApiHostPort,
                    SIDECHAIN_CONNECTOR_ETHEREUM_NODE_HTTP_ADDRESS: this.config.ethereumNodeHttpAddress,
                    SIDECHAIN_CONNECTOR_PUBLIC_IP: this.config.sidechainConnectorPublicIp,
                    SUBSCRIPTION_MANAGER_ETHEREUM_CONTRACT_ADDRESS : this.config.ethereumSubscriptionContractAddress,
                    DEBUG_PORT: this.config.debugPort }
                }
            }, (code: any, stdout: any, stderr: any) => {
                if (code == 0) {
                    resolve(stdout);
                } else {
                    reject(stderr);
                }
            });
        });
    }
}

interface OrbsNodeClusterConfig {
    numOfNodes: number;
    orbsNetwork: TestSubnet;
    publicApiNetwork: TestSubnet;
    ethereumNodeHttpAddress: string;
}

export class OrbsNodeCluster implements TestComponent {
    readonly nodes: OrbsNode[];
    readonly config: OrbsNodeClusterConfig;

    private generateNodeInstances(numOfNodes: number) {
        const gossipPeerIps = [];
        for (let i = 0; i < numOfNodes; i++) {
            gossipPeerIps.push(this.config.orbsNetwork.allocateAddress());
        }
        const gossipPeers = gossipPeerIps.map(ip => `ws://${ip}:60001`);
        const nodes: OrbsNode[] = [];
        for (let i = 0; i < numOfNodes; i++) {
            nodes.push(new OrbsNode({
                nodeName: `node${i + 1}`,
                nodeOrbsNetworkIp: gossipPeerIps[i],
                nodePublicApiIp: this.config.publicApiNetwork.allocateAddress(),
                gossipPeers,
                privateSubnet: `162.100.${i + 1}`,
                sidechainConnectorPublicIp: this.config.publicApiNetwork.allocateAddress(),
                ethereumNodeHttpAddress: this.config.ethereumNodeHttpAddress,
                publicApiHostPort: 20000 + i,
                debugPort: 9229 + i
            }));
        }
        return nodes;
   }

   public getAvailableClients(accessFromHost: boolean) {
       return this.nodes.map(node => node.getPublicApiClient(accessFromHost));
   }

   public async start() {
        await Promise.all(this.nodes.map(node => node.start()));
    }

    public async stop() {
        await Promise.all(this.nodes.map(node => node.stop()));
    }

    public setEthereumSubscriptionContractAddress(contractAddress: string) {
        for (const node of this.nodes) {
            node.setEthereumSubscriptionContractAddress(contractAddress);
        }
    }

    constructor(config: OrbsNodeClusterConfig) {
        this.config = config;
        this.nodes = this.generateNodeInstances(config.numOfNodes);
    }
}
