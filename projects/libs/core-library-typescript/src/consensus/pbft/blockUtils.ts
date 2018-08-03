
import { Block, BlockUtils } from "pbft-typescript";
import { types, BlockUtils as BU } from "../../common-library";
import BlockBuilder from "../block-builder";
import { logger } from "../../common-library/logger";
import { waitUntil } from "./wait-until";



export class PBFTBlockUtils implements BlockUtils {  // TODO: add caching
  public constructor(
    private readonly blockBuilder: BlockBuilder,
    private readonly blockStorage: types.BlockStorageClient) {
  }



  public async requestNewBlock(height: number): Promise<Block> {
    return waitUntil<Block>(this.blockBuilder.getPollingInterval(), () => this.blockBuilder.generateNewBlock(height), `this.blockBuilder.generateNewBlock(height-${height})`);
  }


  public async validateBlock(block: Block): Promise<boolean> { // TODO: add validation on block
    try {
      const output = await this.blockStorage.getBlock({ atHeight: block.header.height - 1 });
      const prevBlockHash: Buffer = BU.calculateBlockHash(output.block);
      logger.debug(`validateBlock for block:${JSON.stringify(block)} at height: ${block.header.height}, previous block: ${JSON.stringify(output.block)} and previous BlockHash ${JSON.stringify(prevBlockHash)} compare ${prevBlockHash.equals(block.header.prevBlockHash)} `);
      if (prevBlockHash.equals(block.header.prevBlockHash)) {
        return true;
      }
    }
    catch (err) {
      logger.debug(`validateBlock ${JSON.stringify(block)}, Thrown error ${err}`);
    }
    return false;
  }

  public calculateBlockHash(block: Block): Buffer {
    return BU.calculateBlockHash(block as types.Block);
  }

}

