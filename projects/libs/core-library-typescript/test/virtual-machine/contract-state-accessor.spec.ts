import { expect } from "chai";
import { ContractStateReadWriteAccessor } from "../../src/virtual-machine/contract-state-accessor";
import { stubInterface } from "ts-sinon";
import { types } from "../../src/common-library/types";
import { StateCache, StateCacheKey } from "../../src/virtual-machine/state-cache";
import { Address } from "../../src/common-library/address";

describe("read-write contract state cache accessor", () => {
  let contractState: ContractStateReadWriteAccessor;
  const contractAddress = Address.createContractAddress("contractName");
  let stateCache: StateCache;
  let stateStorageClient: types.StateStorageClient;
  beforeEach(() => {
    stateCache = stubInterface<StateCache>();
    stateStorageClient = stubInterface<types.StateStorageClient>();
    contractState = new ContractStateReadWriteAccessor(contractAddress.toBuffer(), stateCache, stateStorageClient);
  });
  it("loads correctly a key that was already stored in the state storage", async () => {
    (<sinon.SinonStub>stateStorageClient.readKeys).returns({values: {"key": "value"}});
    expect(await contractState.load("key")).equal("value");
  });
  it("stores a key in the cache and loads it properly", async () => {
    await contractState.store("key", "value");
    expect(stateCache.set).to.have.been.called;
    const [stateCacheKey, value, markIfModified] = (<sinon.SinonSpy>stateCache.set).getCall(0).args;
    (<sinon.SinonStub>stateStorageClient.readKeys).returns({values: {}});
    (<sinon.SinonStub>stateCache.get).withArgs(stateCacheKey).returns(value);
    expect(await contractState.load("key")).equal("value");
  });
});
