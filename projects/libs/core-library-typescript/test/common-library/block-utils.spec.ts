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

    const block: Block = BlockUtils.buildBlock({ header, body }, {
      sign: true,
      keyManager,
      nodeName
    });

    expect(block).to.have.property("signatureData");

    expect(block.signatureData).to.have.property("signatory", nodeName);

    expect(block.signatureData).to.have.property("signature");
    expect(block.signatureData.signature.length).to.be.eql(512);

    expect(BlockUtils.verifyBlockSignature(block, keyManager)).to.be.true;
  });
});
