
import { types, logger, KeyManager } from ".";
import { createHash } from "crypto";
import * as stringify from "json-stable-stringify";
import { isEmpty } from "lodash";

export namespace BlockUtils {
  // TODO: add method parseBlockFromJSON

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
      signatureData: {
        signature: new Buffer(""),
        signatory: "none"
      }
    };

    return block;
  }

  export function buildNextBlock(body: types.BlockBody, prevBlock?: types.Block): types.Block {
    return buildBlock({
      header: {
        // bodyHash: calculateHash(body),
        version: 0,
        prevBlockHash: prevBlock ? calculateBlockHash(prevBlock) : new Buffer(""),
        height: prevBlock ? prevBlock.header.height + 1 : 0
      },
      body
    });
  }

  export function signBlock(block: types.Block, keyManager: KeyManager, nodeName: string) {
    const  signature = Buffer.from(keyManager.sign(BlockUtils.calculateBlockHash(block)), keyManager.SIGNATURE_ENCODING);
    const signatory = nodeName;

    block.signatureData = {
      signature,
      signatory
    };

    return block;
  }

  export function verifyBlockSignature(block: types.Block, keyManager: KeyManager) {
    const signature = block.signatureData.signature.toString(keyManager.SIGNATURE_ENCODING);
    const publicKeyName = block.signatureData.signatory;

    return keyManager.verify(BlockUtils.calculateBlockHash(block), signature, publicKeyName);
  }

  export async function mapOverBlocks(blockStorage: types.BlockStorageClient, lastBlockHeight: number, mapFunction: (block: types.Block) => Promise<void>, limit?: number) {
    const SCROLL_LIMIT = limit || 5000;
    let blockHeight: number = lastBlockHeight;
    let blocks: types.Block[];

    while ((blocks = (await blockStorage.getBlocks({
        lastBlockHeight: blockHeight,
        limit: SCROLL_LIMIT
      })).blocks) && !isEmpty(blocks)) {

      for (const block of blocks) {
        await mapFunction(block);
      }

      blockHeight += SCROLL_LIMIT;
    }
  }
}
