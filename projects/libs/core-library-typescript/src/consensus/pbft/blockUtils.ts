
import { Block, BlockUtils } from "pbft-typescript";
import { types, BlockUtils as BU } from "../../common-library";
import BlockBuilder from "../block-builder";
import { logger } from "../../common-library/logger";
import { waitUntil } from "./wait-until";

// export type predicate = (args: any) => Promise<any>;
// export const ensureMechanism2 = (
//   predicate: predicate,
//   args: any,
//   pollingInterval: number,
//   pollingLimit: number): Promise<any> => {
//   let pollingTime: number = 0;
//   return new Promise<Block>(async function (resolve, reject) {
//     const intervalId = setInterval(async () => {
//       try {
//         pollingTime += pollingInterval;
//         const result = await predicate(args);
//         if (result) {
//           logger.debug(`ensureMechanism with predicate ${JSON.stringify(predicate)}, args ${JSON.stringify(args)} got result ${JSON.stringify(result)}`);
//           resolve(result);
//         }
//         logger.debug(`ensureMechanism with predicate ${JSON.stringify(predicate)}, args ${JSON.stringify(args)} pollingTime ${JSON.stringify(pollingTime)}`);
//         if (pollingTime > pollingLimit) {
//           clearInterval(intervalId);
//           reject();
//         }
//       }
//       catch (err) {
//         logger.debug(`ensureMechanism with predicate ${JSON.stringify(predicate)}, args ${JSON.stringify(args)} Thrown error ${err}`);
//       }
//     }, pollingInterval);
//   });
// };

// export const ensureMechanism = (
//   predicate: predicate,
//   data: any,
//   pollingInterval: number,
//   pollingTime: number,
//   pollingLimit: number
// ): any => {
//   return predicate(data).then(function (val) {
//     try {
//       if (val) {
//         logger.debug(`ensureMechanism with predicate ${JSON.stringify(predicate)}, data ${JSON.stringify(data)} got result ${JSON.stringify(val)}`);
//         return val;
//       }
//       setTimeout(ensureMechanism, pollingInterval, data, pollingTime);

//       logger.debug(`ensureMechanism with predicate ${JSON.stringify(predicate)}, data ${JSON.stringify(data)} pollingTime ${JSON.stringify(pollingTime)}`);
//       if (pollingTime > pollingLimit) {
//         return undefined;
//       }
//     }
//     catch (err) {
//       logger.debug(`ensureMechanism with predicate ${JSON.stringify(predicate)}, data ${JSON.stringify(data)} Thrown error ${err}`);
//     }
//     finally {
//       pollingTime += pollingInterval;
//       setTimeout(ensureMechanism, pollingInterval, data, pollingTime);
//     }
//   });
// };


export class PBFTBlockUtils implements BlockUtils {
  // private lastBlockHash: Buffer;
  // private lastBlockHeight: number;

  public constructor(
    private readonly blockBuilder: BlockBuilder,
    private readonly blockStorage: types.BlockStorageClient) {
  }

  // public setLastBlock(lastBlock: types.Block): void {
  //   this.lastBlockHash = this.calculateBlockHash(lastBlock);
  //   this.lastBlockHeight = lastBlock.header.height;
  // }



  // private waitFor<T>(pollingInterval: number, predicate: () => Promise<T>): Promise<T> {
  //   return new Promise<T>(resolve => {
  //     const func = () => {
  //       predicate().then(val => {
  //           if (val === undefined || val === null) {
  //             setTimeout(func, pollingInterval);
  //           } else {
  //             resolve(val);
  //           }
  //       });
  //     };
  //     func();
  //   });
  // }

  // private async ensureBlockIsSet(height: number,
  //   blockBuilder: BlockBuilder,
  //   pollingInterval: number,
  //   pollingLimit: number): Promise<Block> {

  //     this.foo(async () => blockBuilder.generateNewBlock(height));
  //   return new Promise<Block>(resolve => {
  //     const func = () => {
  //       // blockBuilder.generateNewBlock(height)
  //       predicte().then(val: any); => {
  //         .then((block: Block) => {
  //           logger.debug(`ensureBlockIsSet ${height}, generateNewBlock ${JSON.stringify(block)}`);
  //           if (block && block.header) {
  //             logger.debug(`ensureBlockIsSet ${height}, Got a Block ${JSON.stringify(block)}`);
  //             resolve(block);
  //           } else {
  //             setTimeout(func, pollingInterval);
  //           }
  //         });
  //     }
  //     func();
  //   });
  // }

  public async requestNewBlock(height: number): Promise<Block> {
    // const pollingInterval: number = this.blockBuilder.getPollingInterval();
    // const pollingLimit: number = this.blockBuilder.getPollingInterval() * 100;
    // return ensureMechanism(this.blockBuilder.generateNewBlock, height, pollingInterval, 0, pollingLimit);
    // if (height !== this.lastBlockHeight + 1) {
    //   reject(height);
    // }
    return waitUntil<Block>(this.blockBuilder.getPollingInterval(), () => this.blockBuilder.generateNewBlock(height), `this.blockBuilder.generateNewBlock(height-${height})`);
    // return this.ensureBlockIsSet(height, this.blockBuilder, this.blockBuilder.getPollingInterval(), this.pollingLimit);
  }

  // private async getOrFetch(height: number): Promise<types.Block> {
  //   if ()
  //   const { block } = await this.blockStorage.getBlock({ atHeight: height });
  //   return block;
  // }

  public async validateBlock(block: Block): Promise<boolean> { // TODO: more validation on block
    try {
      // if (block.header.height === this.lastBlockHeight + 1) {
      //   if (this.lastBlockHash.equals(block.header.prevBlockHash)) {
      //     return true;
      //   }
      // }
      // const prevBlock = await this.getOrFetch(block.header.height - 1 );
      // const lastBlockHash: Buffer = BU.calculateBlockHash(prevBlock);

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

