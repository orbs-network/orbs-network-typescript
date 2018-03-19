import { types,  } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import * as chaiAsPromised from "chai-as-promised";
import { stubInterface } from "ts-sinon";
import { BlockUtils } from "../../src/common-library";
import { StateStorage } from "../../src/state-storage";
import * as sinon from "sinon";

chai.use(sinonChai);

function anInitialBlockChain(numOfBlocks, stateDiff: types.ModifiedStateKey[]): types.Block[] {
  const blocks: types.Block[] = [];
  let prevBlock: types.Block;
  for (let i = 0; i < numOfBlocks - 1; i++) {
    prevBlock = BlockUtils.buildNextBlock({transactions: [], stateDiff: []}, prevBlock);
    blocks.push(prevBlock);
  }
  // one last block with the state diff
  const lastBlock = BlockUtils.buildNextBlock({
    transactions: [],
    stateDiff
  }, prevBlock);
  blocks.push(lastBlock);

  return blocks;
}



describe("the state storage", () => {
  let blockStorage: types.BlockStorageClient;
  let stateStorage: StateStorage;
  const contractAddress: types.ContractAddress = { address: "dummyContract" };
  const blocks = anInitialBlockChain(4, [{contractAddress , key: "dummyKey", value: "dummyValue"}]);
  before(async () => {
    blockStorage = stubInterface<types.BlockStorageClient>();
    const lastBlock = blocks[blocks.length - 1];
    blockStorage.getLastBlock.returns({block: blocks[blocks.length - 1]});
    blockStorage.getBlocks = input => ({ blocks: blocks.slice(input.lastBlockHeight + 1) });

    stateStorage = new StateStorage(blockStorage);
    stateStorage.poll();
  });

  it("is quickly synced with the block storage after starts polling", async() => {
    const expectedResult = new Map<string, string>([["dummyKey", "dummyValue"]]);
    await expect(stateStorage.readKeys(contractAddress, ["dummyKey"])).to.eventually.eql(expectedResult);
  });

  after(async () => {
    stateStorage.stopPolling();
  });
});
