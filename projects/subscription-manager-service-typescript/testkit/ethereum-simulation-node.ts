import * as ganache from "ganache-core";
import * as solc from "solc";

const Web3 = require("web3");

export class EthereumSimulationNode {
    server: any;
    port: number;

    constructor() {
        this.server = ganache.server({ accounts: [{ balance: "300000000000000000000" }], total_accounts: 1 });
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
