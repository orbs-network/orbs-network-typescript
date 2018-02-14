import { exec } from "shelljs";
import * as path from "path";
import TestComponent from "./test-component";
import TestSubnet from "./test-subnet";
import { delay } from "bluebird";
import { initPublicApiClient } from "../public-api-client";


const PROJECT_ROOT_FOLDER = path.join(__dirname, "../../../");
const COMPOSE_CONFIG_PATH = PROJECT_ROOT_FOLDER;
const NODE_CONFIG_PATH = "/opt/orbs/config/topology";

export interface OrbsNodeDeployParams {
    nodeName: string;
    nodeOrbsNetworkIp: string;
    nodePublicApiIp: string;
    privateSubnet: string;
    forceRecreate?: boolean;
    PublicApiHostPort: number;
    gossipPeers: string[];
    ethereumNodeHttpAddress?: string;
    ethereumOrbsSubscriptionContractAddress?: string;
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
        await delay(60000);
    }

    public async stop(): Promise<void> {
        await this.runDockerCompose("down");
    }

    public getPublicApiClient(accessFromHost = true) {
        const endpoint = accessFromHost ? `0.0.0.0:${this.deployParams.PublicApiHostPort}` : `${this.deployParams.nodePublicApiIp}:51151`;
        return initPublicApiClient({ endpoint });
    }

    private runDockerCompose(dockerComposeCommand: string) {
       return new Promise((resolve, reject) => {
           exec(`docker-compose -p orbs-${this.deployParams.nodeName} -f docker-compose.test.volumes.yml -f docker-compose.test.networks.yml -f docker-compose.test.services.yml ${dockerComposeCommand}`, {
            async: true,
            cwd: COMPOSE_CONFIG_PATH,
            env: {...process.env, ...{
                NODE_CONFIG_PATH : "/opt/orbs/config/topology",
                PRIVATE_NETWORK: this.deployParams.privateSubnet,
                NODE_NAME: this.deployParams.nodeName,
                NODE_IP: this.deployParams.nodeOrbsNetworkIp,
                PUBLIC_API_IP: this.deployParams.nodePublicApiIp,
                GOSSIP_PEERS: this.deployParams.gossipPeers,
                PUBLIC_API_HOST_PORT: this.deployParams.PublicApiHostPort,
                SIDECHAIN_CONNECTOR__ETHEREUM_NODE_HTTP_ADDRESS: this.deployParams.ethereumNodeHttpAddress,
                SUBSCRIPTION_MANAGER__ETHEREUM_CONTRACT_ADDRESS : this.deployParams.ethereumOrbsSubscriptionContractAddress
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

interface OrbsNodeClusterOptions {
    numOfNodes: number;
    orbsNetwork: TestSubnet;
    publicApiNetwork: TestSubnet;
    ethereumNodeHttpAddress?: string;
    ethereumOrbsSubscriptionContractAddress?: string;
}

export class OrbsNodeCluster implements TestComponent {
    readonly nodes: OrbsNode[];
    readonly options: OrbsNodeClusterOptions;



    private generateNodeInstances(numOfNodes: number) {
        const gossipPeerIps = [];
        for (let i = 0; i < numOfNodes; i++) {
            gossipPeerIps.push(this.options.orbsNetwork.allocateAddress());
        }
        const gossipPeers = gossipPeerIps.map(ip => `ws://${ip}:60001`);
        const nodes: OrbsNode[] = [];
        for (let i = 0; i < numOfNodes; i++) {
            nodes.push(new OrbsNode({
                nodeName: `node${i + 1}`,
                nodeOrbsNetworkIp: gossipPeerIps[i],
                nodePublicApiIp: this.options.publicApiNetwork.allocateAddress(),
                gossipPeers,
                privateSubnet: `162.100.${i + 1}`,
                ethereumNodeHttpAddress: this.options.ethereumNodeHttpAddress,
                ethereumOrbsSubscriptionContractAddress: this.options.ethereumOrbsSubscriptionContractAddress,
                PublicApiHostPort: 20000 + i
            }));
        }
        return nodes;
   }

   public getAvailableClients() {
       return this.nodes.map(node => node.getPublicApiClient());
   }

   public async start() {
        await Promise.all(this.nodes.map(node => node.start()));
    }

    public async stop() {
        await Promise.all(this.nodes.map(node => node.stop()));
    }

    public setOrbsSubscriptionContractAddress(contractAddress: string) {
        this.options.ethereumOrbsSubscriptionContractAddress = contractAddress;
    }

    constructor(opts: OrbsNodeClusterOptions) {
        this.options = opts;
        this.nodes = this.generateNodeInstances(opts.numOfNodes);
    }
}