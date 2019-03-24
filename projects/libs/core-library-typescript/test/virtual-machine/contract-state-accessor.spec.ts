/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { expect } from "chai";
import * as chai from "chai";
import * as sinonChai from "sinon-chai";
import { ContractStateReadWriteAccessor } from "../../src/virtual-machine/contract-state-accessor";
import { stubInterface } from "ts-sinon";
import { types } from "../../src/common-library/types";
import { StateCache, StateCacheKey } from "../../src/virtual-machine/state-cache";
import { Address } from "../../src/common-library/address";

chai.use(sinonChai);

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
