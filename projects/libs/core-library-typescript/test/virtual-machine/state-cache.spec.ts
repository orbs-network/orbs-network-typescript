/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { StateCache, StateCacheKey } from "../../src/virtual-machine/state-cache";
import { expect } from "chai";
import { Address } from "../../src/common-library/address";

describe("state cache", () => {
  let stateCache: StateCache;
  beforeEach(() => {
    stateCache = new StateCache();
  });
  it("loads a key that was stored with the correct value", () => {
    const key: StateCacheKey = {
      contractAddress: Address.createContractAddress("contractName").toBuffer(),
      key: "key"
    };
    stateCache.set(key, "value");
    expect(stateCache.get(key)).to.equal("value");
  });
});
