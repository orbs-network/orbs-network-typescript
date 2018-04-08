import * as chai from "chai";
import * as mocha from "mocha";
// import { VirtualMachine } from "../../../libs/core-library-typescript/src/virtual-machine";
// import { types } from "../../../libs/core-library-typescript/src/common-library/types";
import { types, VirtualMachine, ServiceRunner, grpc, GRPCRuntime } from "orbs-core-library";
import { CallContractOutput } from "orbs-interfaces";
import * as _ from "lodash";
import VirtualMachineService from "../src/service";
import * as getPort from "get-port";


const { expect } = chai;


// just validates the address (sender name) and nothing else
class StubStorageClient implements types.StateStorageClient {
    keyMap: { [id: string]: string };
    contractAddress: types.ContractAddress;

    constructor(opts: { contractAddress: types.ContractAddress, keyMap: { [id: string]: string } }) {
      this.contractAddress = opts.contractAddress;
      this.keyMap = opts.keyMap;
    }

    readKeys(input: types.ReadKeysInput): types.ReadKeysOutput {
      if (input.contractAddress.address != this.contractAddress.address) {
        throw new Error(`State storage supports only a single contract ${this.contractAddress} != ${input.contractAddress}`);
      }
      return { values: _.pick(this.keyMap, input.keys) };
    }
  }


describe("vm service tests", () => {
    let virtualMachine: VirtualMachine;
    let stateStorage: StubStorageClient;

    const senderAddress: types.UniversalAddress = {
        id: new Buffer("account1"),
        scheme: 0,
        checksum: 0,
        networkId: 0
      };

    const payload = JSON.stringify({
      method: "getMyBalance",
      args: []
    });

    let service: VirtualMachineService;
    let server: GRPCRuntime;
    let endpoint: string;

    beforeEach(async () => {
      endpoint = `127.0.0.1:${await getPort()}`;

      stateStorage = new StubStorageClient({
        contractAddress: {address: "peon" },
        keyMap: { "balances.account1": "10", "balances.account2": "0" }
      });

      const contractRegistryConfig = {
        contracts: [
          {address: "peon", filename: "foobar-smart-contract"}
        ]
      };

      virtualMachine = new VirtualMachine(contractRegistryConfig, stateStorage);
      service = new VirtualMachineService(virtualMachine,  { nodeName: "tester" });
      server = await ServiceRunner.run(grpc.virtualMachineServer, service, endpoint);
    });

    it("should-load-contract-from-service", async () => {
      let result: CallContractOutput;
      const client = grpc.virtualMachineClient({ endpoint });
      result = await client.callContract({
          sender: senderAddress,
          contractAddress: {address: "peon"},
          payload: payload  // if payload is not a json string this ends poorly
      });

      expect(result.resultJson).to.equal("10");
    });

    afterEach(async () => {
      ServiceRunner.stop(server);
    });
});