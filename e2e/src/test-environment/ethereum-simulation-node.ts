import * as ganache from "ganache-core";
import * as solc from "solc";
import TestComponent from "./test-component";
const Web3 = require("web3");

export class EthereumSimulationNode implements TestComponent {
    readonly server: any;
    readonly port: number;
    private running: boolean = false;

    constructor(port: number = 1545) {
        this.port = port;
        this.server = ganache.server({ accounts: [{ balance: "300000000000000000000" }], total_accounts: 1 });
    }

    public async start() {
        if (this.running) {
            throw "already running";
        }
        this.server.listen(this.port);
        this.running = true;
    }

    public async stop() {
        this.server.close();
        this.running = false;
    }

    async deployOrbsStubContract(minTokensForSubscription: number, activeSubscriptionId: string) {
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

        const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:${this.port}`));
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
