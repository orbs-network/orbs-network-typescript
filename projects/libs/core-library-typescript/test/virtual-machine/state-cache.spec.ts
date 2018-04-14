import { StateCache, StateCacheKey } from "../../src/virtual-machine/state-cache";
import { expect } from "chai";
import { createContractAddress } from "../../src/common-library/address";

describe("state cache", () => {
  let stateCache: StateCache;
  beforeEach(() => {
    stateCache = new StateCache();
  });
  it("loads a key that was stored with the correct value", () => {
    const key: StateCacheKey = {
      contractAddress: createContractAddress("contractName").toBuffer(),
      key: "key"
    };
    stateCache.set(key, "value");
    expect(stateCache.get(key)).to.equal("value");
  });
});
