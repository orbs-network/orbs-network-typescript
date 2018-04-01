
import { types, logger } from ".";
import { createHash } from "crypto";
import * as stringify from "json-stable-stringify";

export namespace BlockUtils {
  export function calculateBlockHash(block: types.Block): Buffer {
    const hash = createHash("sha256");

    hash.update(stringify(block.header));

    hash.update(stringify(block.body));

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
