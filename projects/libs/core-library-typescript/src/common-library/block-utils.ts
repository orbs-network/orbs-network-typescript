
import { types, logger } from ".";
import { createHash } from "crypto";

export namespace BlockUtils {
  export function calculateBlockHash(block: types.Block): Buffer {
    // TODO: this is just a placeholder. Replace with the real algorithm once specified
    const hash = createHash("sha256");

    hash.update(JSON.stringify(block.header));

    hash.update(JSON.stringify(block.body));

    return hash.digest();
  }

  export function buildBlock(blockComponents: {header: types.BlockHeader, body: types.BlockBody}): types.Block {
    const block: types.Block = {
      header: blockComponents.header,
      body: blockComponents.body,
    };

    return block;
  }

  export function buildNextBlock(body: types.BlockBody, prevBlock?: types.Block): types.Block {
    return buildBlock({
      header: {
        version: 0,
        prevBlockHash: prevBlock ? calculateBlockHash(prevBlock) : new Buffer(""),
        height: prevBlock ? prevBlock.header.height + 1 : 0
      },
      body
    });
  }
}
