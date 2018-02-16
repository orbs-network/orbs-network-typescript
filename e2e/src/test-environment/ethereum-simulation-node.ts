import * as ganache from "ganache-core";
import * as solc from "solc";
import TestComponent from "./test-component";
const Web3 = require("web3");

import { delay } from "bluebird";
import { exec } from "shelljs";
import * as path from "path";

const DOCKER_CONFIG_PATH = path.resolve(path.join(__dirname, "../../config/docker"));


interface EthereumSimulationNodeConfig {
    publicIp: string;
}

export default class EthereumSimulationNode implements TestComponent {
    config: EthereumSimulationNodeConfig;

    constructor(config: EthereumSimulationNodeConfig) {
        this.config = config;
    }

    public async start(): Promise<void> {
        await this.runDockerCompose("up -d");
        await delay(1000);
    }

    public async stop(): Promise<void> {
        await this.runDockerCompose("down");
    }

    private runDockerCompose(dockerComposeCommand: string) {
        return new Promise((resolve, reject) => {
            exec(`docker-compose -p orbs-test-ethereum -f docker-compose.test.networks.yml -f docker-compose.test.ethereum.yml ${dockerComposeCommand}`, {
             async: true,
             cwd: DOCKER_CONFIG_PATH,
             env: {...process.env, ...{
                 PUBLIC_IP: this.config.publicIp,
             }}}, (code: any, stdout: any, stderr: any) => {
                 if (code == 0) {
                     resolve(stdout);
                 } else {
                     reject(stderr);
                 }
             });
         });
     }

     public getPublicAddress(connectFromHost = false) {
         const address = connectFromHost ? "localhost" : this.config.publicIp;
         return `http://${address}:8545`;
     }


    async deployOrbsStubContract(minTokensForSubscription: number, activeSubscriptionId: string, connectFromHost: boolean) {
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

        const web3 = new Web3(new Web3.providers.HttpProvider(this.getPublicAddress(connectFromHost)));
        // compile contract
        const output = solc.compile(STUD_ORBS_TOKEN_SOLIDITY_CONTRACT, 1);
        if (output.errors)
            throw output.errors;
        const bytecode = output.contracts[":stubOrbsToken"].bytecode;
        const abi = JSON.parse(output.contracts[":stubOrbsToken"].interface);
        // deploy contract
        const contract = new web3.eth.Contract(abi, undefined, { data: `0x${bytecode}` });
        const tx = contract.deploy({ arguments: [minTokensForSubscription, activeSubscriptionId], data: undefined });

        const account = (await web3.eth.getAccounts())[0];
        const deployedContract = await tx.send({
            from: account,
            gas: await tx.estimateGas()
        });
        return deployedContract.options.address;
    }
}
