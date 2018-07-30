import { JsonBuffer, BlockUtils, types } from "../common-library";
import { logger } from "../common-library/logger";
import { BaseConsensusConfig, BaseConsensus } from "./base-consensus";
import BlockBuilder from "./block-builder";
import { PBFT, Config, TimerBasedElectionTrigger, ElectionTriggerFactory, Block } from "pbft-typescript";
import { PBFTBlockUtils } from "./pbft/blockUtils";
import { PBFTNetwork } from "./pbft/network-communication";
import { PBFTLogger } from "./pbft/logger";
import { PBFTKeyManager } from "./pbft/keyManger";
import { waitUntil } from "./pbft/wait-until";



// interface PBFTServices {
//   getLastBlock: types.BlockStorageClient;
// }

export class PBFTConsensus extends BaseConsensus {
  private pbft: PBFT;
  private pbftNet: PBFTNetwork;
  private keyManager: PBFTKeyManager;
  private pbftConfig: Config;
  private blockUtils: PBFTBlockUtils;
  private lastBlock: types.Block;
  private syncIntervalId: NodeJS.Timer;

  private config: BaseConsensusConfig;
  private blockBuilder: BlockBuilder;
  private gossip: types.GossipClient;
  private blockStorage: types.BlockStorageClient;

  private configSanitation(key: string, value: any): any {
    if (key == "keyManager") {
      return undefined;
    }
    return value;
  }

  public constructor(
    config: BaseConsensusConfig,
    gossip: types.GossipClient,
    blockStorage: types.BlockStorageClient,
    transactionPool: types.TransactionPoolClient,
    virtualMachine: types.VirtualMachineClient
  ) {
    super();
    logger.info(`Starting pbft consensus with configuration: ${JSON.stringify(config, this.configSanitation)}`);
    this.config = config;
    this.blockStorage = blockStorage;
    this.gossip = gossip;
    this.blockBuilder = new BlockBuilder({
      virtualMachine, transactionPool, blockStorage, newBlockBuildCallback: undefined,
      config: {
        sign: config.signBlocks,
        keyManager: config.keyManager,
        nodeName: config.nodeName,
        pollIntervalMs: config.blockBuilderPollInterval
      }
    });

    this.keyManager = new PBFTKeyManager(this.config.consensusKeyManager, this.config.nodeName);
    this.pbftNet = new PBFTNetwork(this.config.clusterSize, this.keyManager, this.gossip);
    this.blockUtils = new PBFTBlockUtils(this.blockBuilder, this.blockStorage);
    this.pbftConfig = this.buildPBFTConfig();
  }

  private buildPBFTConfig(): Config {

    const logger = new PBFTLogger();
    const electionTriggerFactory: ElectionTriggerFactory = (view: number) => new TimerBasedElectionTrigger(this.config.electionTimeout.min * 2 ** view);
    return {
      networkCommunication: this.pbftNet,
      logger,
      electionTriggerFactory,
      blockUtils: this.blockUtils,
      keyManager: this.keyManager,
    };
  }


  async initialize(): Promise<any> {
    await this.blockBuilder.initialize();
    this.pbft = new PBFT(this.pbftConfig);
    this.pbft.registerOnCommitted((block: types.Block) => this.onCommitted(block));
    await this.ensureServicesUp(this.blockBuilder.getPollingInterval());
    logger.debug(`PBFT Consensus init on lastBlock - height: ${this.lastBlock.header.height}`);
    this.pbft.start(this.lastBlock.header.height + 1);
    // this.syncPolling(this.config.heartbeatInterval * 20);
  }


  private async getLastBlock(): Promise<types.Block> {
    try {
      const { block } = await this.blockStorage.getLastBlock({});
      return block;
    }
    catch (err) {
      logger.debug(`Wait for getLastBlock  `);
    }
    return undefined;
  }


  private async ensureServicesUp(pollingInterval: number): Promise<void> {
    this.lastBlock = await waitUntil<types.Block>(pollingInterval, () => this.getLastBlock(), `this.getLastBlock()`);
  }


  async shutdown(): Promise<any> {
    this.pbft.dispose();
    this.pbftNet.dispose();
    await this.blockBuilder.shutdown();
    clearInterval(this.syncIntervalId);
    delete this.syncIntervalId;
  }


  private async onCommitted(committedBlock: types.Block) {
    logger.debug(`New block to be committed ${JSON.stringify(committedBlock)}, blockSize approx ${Buffer.byteLength(JSON.stringify(committedBlock), "utf8")}`);
    try {
      // this.blockUtils.setLastBlock(committedBlock);
      this.lastBlock = committedBlock;
      await this.blockBuilder.commitBlock(committedBlock);
    } catch (err) {
      logger.error(`Failed to commit block with height ${committedBlock.header.height},`, err);
    }
  }



  async onMessageReceived(fromAddress: string, messageType: string, message: any): Promise <any> {
    this.pbftNet.onRemoteMessage(messageType, message);
  }


  private syncPolling(pollingInterval: number): void {
    if (this.syncIntervalId) {
      return;
    }
    let pollingTime: number = -pollingInterval;
    this.syncIntervalId = setInterval(async () => {
        try {
          pollingTime += pollingInterval;
          logger.debug(`consensus sync ${pollingTime} `);
          const { block } = await this.blockStorage.getLastBlock({});
          if (block) {
            logger.debug(`PBFT Consensus syncing ${pollingTime} block at height: ${block.header.height}`);
            if (this.lastBlock.header.height < block.header.height) {
              const isValidBlock: boolean = await this.blockUtils.validateBlock(block);
              if (isValidBlock) {
                logger.debug(`PBFT Consensus syncing validated block${pollingTime} `);
                this.lastBlock = block;
                this.pbft.start(this.lastBlock.header.height + 1);
              }
            }
          }
        }
        catch (err) {
          logger.debug(`consensus sync - Thrown ${pollingTime} ${err}`);
        }
    }, pollingInterval);
  }

}


