
import { types, logger } from ".";
import { createHash } from "crypto";

export namespace BlockUtils {
  export function calculateBlockHash(blockComponents: {header: types.BlockHeader, body: types.BlockBody}): Buffer {
    // TODO: this is just a placeholder. Replace with the real algorithm once specified
    const hash = createHash("sha256");

    hash.update(JSON.stringify(blockComponents.header));

    hash.update(JSON.stringify(blockComponents.body));

    return hash.digest();
  }

  export function buildBlock(blockComponents: {header: types.BlockHeader, body: types.BlockBody}): types.Block {
    const blockHash = calculateBlockHash(blockComponents);

    const block: types.Block = {
      header: blockComponents.header,
      body: blockComponents.body,
      hash: blockHash
    };

    return block;
  }

  export function buildNextBlock(body: types.BlockBody, prevBlock?: types.Block): types.Block {
    return buildBlock({
      header: {
        version: 0,
        prevBlockHash: prevBlock ? prevBlock.hash : new Buffer(""),
        height: prevBlock ? prevBlock.header.height + 1 : 0
      },
      body
    });
  }
}
