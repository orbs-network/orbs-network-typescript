import { types, } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import * as chaiAsPromised from "chai-as-promised";
import { stubInterface } from "ts-sinon";
import { BlockUtils } from "../../src/common-library";
import { StateStorage } from "../../src/state-storage";
import * as sinon from "sinon";
import { Address } from "../../src/common-library/address";

chai.use(sinonChai);
chai.use(chaiAsPromised);

function anInitialBlockChain(numOfBlocks: number, stateDiff: types.ModifiedStateKey[]): types.Block[] {
  const blocks: types.Block[] = [];
  let prevBlock: types.Block;
  for (let i = 0; i < numOfBlocks - 1; i++) {
    prevBlock = BlockUtils.buildNextBlock({ transactions: [], stateDiff: [], transactionReceipts: [] }, prevBlock);
    blocks.push(prevBlock);
  }
  // one last block with the state diff
  const lastBlock = BlockUtils.buildNextBlock({
    transactions: [],
    transactionReceipts: [],
    stateDiff
  }, prevBlock);
  blocks.push(lastBlock);

  return blocks;
}



describe("the state storage", () => {
  let blockStorage: types.BlockStorageClient;
  let stateStorage: StateStorage;
  const contractAddress = Address.createContractAddress("dummyContract").toBuffer();
  const blocks = anInitialBlockChain(4, [{ contractAddress, key: "dummyKey", value: "dummyValue" }]);
  const pollingInterval = 200;
  beforeEach((done) => {
    blockStorage = stubInterface<types.BlockStorageClient>();
    (<sinon.SinonStub>blockStorage.getLastBlock).returns({ block: blocks[blocks.length - 1] });
    blockStorage.getBlocks = input => ({ blocks: blocks.slice((input.lastBlockHeight || 0) + 1) });

    stateStorage = new StateStorage(blockStorage, pollingInterval);
    done();
  });

  it("is quickly synced with the block storage after starts polling", async () => {
    const expectedResult = new Map<string, string>([["dummyKey", "dummyValue"]]);
    await expect(stateStorage.readKeys(contractAddress, ["dummyKey"])).to.eventually.eql(expectedResult);
  });

  it("polling did not expload when blockStorage did not initialize", () => {
    blockStorage.getBlocks = input => { throw new ReferenceError("Block Storage not initiailized"); };
    stateStorage.stop();
    expect(async () => { await stateStorage.pollBlockStorage(); }).to.not.throw();
  });

  it("polling exploads when blockStorage returns an unexpected error", async () => {
    blockStorage.getBlocks = input => { throw new Error("some-random-error"); };
    stateStorage.stop();
    await expect(stateStorage.pollBlockStorage()).to.be.rejectedWith(Error);
  });

  afterEach((done) => {
    stateStorage.stop();
    done();
  });
});

describe("the state storage", function () {
  let blockStorage: types.BlockStorageClient;
  let stateStorage: StateStorage;
  const contractAddress = Address.createContractAddress("dummyContract").toBuffer();
  const blocks = anInitialBlockChain(0, []);
  const pollingInterval = 200;

  this.timeout(5500);

  beforeEach((done) => {
    blockStorage = stubInterface<types.BlockStorageClient>();
    const lastBlock = blocks[0];
    (<sinon.SinonStub>blockStorage.getLastBlock).returns({ block: lastBlock });
    blockStorage.getBlocks = input => ({ blocks: blocks.slice((input.lastBlockHeight || 0) + 1) });

    stateStorage = new StateStorage(blockStorage, pollingInterval);
    done();
  });

  it("can read state for contract from genesis block", async () => {
    const expectedResult = new Map<string, string>();
    await expect(stateStorage.readKeys(contractAddress, ["dummyKey"])).to.eventually.eql(expectedResult);
  });

  afterEach((done) => {
    stateStorage.stop();
    done();
  });
});
