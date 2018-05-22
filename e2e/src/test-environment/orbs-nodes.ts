import { exec } from "shelljs";
import * as path from "path";
import TestComponent from "./test-component";
import TestSubnet from "./test-subnet";
import { delay } from "bluebird";


const DOCKER_CONFIG_PATH = path.resolve(path.join(__dirname, "../../config/docker"));
const NODE_CONFIG_PATH = "/opt/orbs/config/topologies/discovery/node1";
const VCHAIN_ID = "640ed3"; // TODO: vchainId should not be hard-coded but rather propagated from the test config!!!
const TEST_SMART_CONTRACTS = [
  {vchainId: VCHAIN_ID, name : "foobar", filename: "foobar-smart-contract"},
  {vchainId: VCHAIN_ID, name: "text-message", filename: "text-message-smart-contract"}
];

export interface SubscriptionConfig {
  minTokensForSubscription: number;
  subscriptionProfile: string;
}
export interface OrbsNodeConfig {
  nodeName: string;
  numOfNodes: number;
  nodeOrbsNetworkIp: string;
  nodePublicApiIp: string;
  privateSubnet: string;
  forceRecreate?: boolean;
  publicApiHostPort: number;
  publicApiHostHTTPPort: number;
  sidechainConnectorPublicIp: string;
  gossipPeers: string[];
  ethereumNodeHttpAddress: string;
  ethereumSubscriptionContractAddress?: string;
  subscriptionConfig: SubscriptionConfig;
  debugPort: number;
  envFile: string;
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

  public getApiEndpoint(accessFromHost: boolean): string {
    const endpoint = accessFromHost ? `http://127.0.0.1:${this.config.publicApiHostHTTPPort}` : `http://${this.config.nodePublicApiIp}:80`;
    return endpoint;
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
        env: {
          ...process.env, ...{
            NODE_CONFIG_PATH: NODE_CONFIG_PATH,
            PRIVATE_NETWORK: this.config.privateSubnet,
            NODE_NAME: this.config.nodeName,
            NODE_IP: this.config.nodeOrbsNetworkIp,
            NUM_OF_NODES: this.config.numOfNodes,
            PUBLIC_API_IP: this.config.nodePublicApiIp,
            GOSSIP_PEERS: this.config.gossipPeers,
            PUBLIC_API_HOST_PORT: this.config.publicApiHostPort,
            PUBLIC_API_HOST_HTTP_PORT: this.config.publicApiHostHTTPPort,
            SIDECHAIN_CONNECTOR_ETHEREUM_NODE_HTTP_ADDRESS: this.config.ethereumNodeHttpAddress,
            SIDECHAIN_CONNECTOR_PUBLIC_IP: this.config.sidechainConnectorPublicIp,
            SUBSCRIPTION_MANAGER_ETHEREUM_CONTRACT_ADDRESS: this.config.ethereumSubscriptionContractAddress,
            SUBSCRIPTION_PROFILES: JSON.stringify({
              [this.config.subscriptionConfig.subscriptionProfile]: [{
                expiresAt: Date.now() + 24 * 60 * 60 * 1000 * 30, // expires 30 days from now
                rate: this.config.subscriptionConfig.minTokensForSubscription
              }]
            }),
            VIRTUAL_MACHINE_SMART_CONTRACTS_TO_LOAD: JSON.stringify(TEST_SMART_CONTRACTS),
            DEBUG_PORT: this.config.debugPort,
            ENV_FILE: this.config.envFile
          }
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
  envFile: string;
  subscriptionConfig: SubscriptionConfig;
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
        numOfNodes: numOfNodes,
        nodeOrbsNetworkIp: gossipPeerIps[i],
        nodePublicApiIp: this.config.publicApiNetwork.allocateAddress(),
        gossipPeers,
        privateSubnet: `162.100.${i + 1}`,
        sidechainConnectorPublicIp: this.config.publicApiNetwork.allocateAddress(),
        ethereumNodeHttpAddress: this.config.ethereumNodeHttpAddress,
        publicApiHostPort: 20000 + i,
        publicApiHostHTTPPort: 30000 + i,
        debugPort: 9229 + i,
        envFile: this.config.envFile,
        subscriptionConfig: this.config.subscriptionConfig
      }));
    }
    return nodes;
  }

  public getAvailableApiEndpoints(accessFromHost: boolean) {
    return this.nodes.map(node => node.getApiEndpoint(accessFromHost));
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
