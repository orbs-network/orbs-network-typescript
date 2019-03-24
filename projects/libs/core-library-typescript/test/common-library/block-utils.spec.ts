/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { KeyManagerConfig, KeyManager, BlockUtils } from "../../src";
import generateKeyPairs from "../../src/test-kit/generate-key-pairs";
import { BlockHeader, BlockBody, Block } from "orbs-interfaces";
import { expect } from "chai";

describe("Block utils", () => {
  let keyManagerConfig: KeyManagerConfig;
  let keyManager: KeyManager;

  before(function() {
    keyManagerConfig = generateKeyPairs(this);
    keyManager = new KeyManager(keyManagerConfig);
  });

  it("can produce signed blocks", () => {
    const header: BlockHeader = {
      height: 0,
      prevBlockHash: new Buffer(""),
      version: 0
    };

    const body: BlockBody = {
      stateDiff: [],
      transactionReceipts: [],
      transactions: []
    };

    const nodeName = "secret-message-key";

    const block: Block = BlockUtils.signBlock(BlockUtils.buildBlock({ header, body }), keyManager, nodeName);

    expect(block).to.have.property("signatureData");

    expect(block.signatureData).to.have.property("signatory", nodeName);

    expect(block.signatureData).to.have.property("signature");
    expect(block.signatureData.signature.length).to.be.eql(512);

    expect(BlockUtils.verifyBlockSignature(block, keyManager)).to.be.true;
  });
});
