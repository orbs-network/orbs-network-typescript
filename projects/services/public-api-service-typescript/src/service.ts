import * as _ from "lodash";

import {  } from "orbs-core-library";
import { logger, types, Service, ServiceConfig, JsonBuffer, PublicApi, TransactionHandler, bs58DecodeRawAddress } from "orbs-core-library";
import * as express from "express";
import { Server } from "http";
import * as bodyParser from "body-parser";

export interface PublicApiHTTPServiceConfig extends ServiceConfig {
  validateSubscription: boolean;
  httpPort: number;
}

export default class PublicApiHTTPService extends Service {
  private publicApi: PublicApi;
  private transactionHandler: TransactionHandler;
  private app: express.Express;
  private server: Server;

  public constructor(virtualMachine: types.VirtualMachineClient, transactionPool: types.TransactionPoolClient, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.transactionHandler = new TransactionHandler(transactionPool);

    this.publicApi = new PublicApi(this.transactionHandler, virtualMachine);
  }

  async initialize() {
    this.initializeApp();
  }

  async shutdown() {
    this.shutdownApp();
  }

  private initializeApp() {
    this.app = express();
    this.app.use(bodyParser.raw({ type: "*/*" }));

    this.app.use("/public/sendTransaction", this.getHTTPSendTransactionRequestHandler());
    this.app.use("/public/callContract", this.getHTTPCallContractRequestHandler());

    const { httpPort } = (<PublicApiHTTPServiceConfig>this.config);
    this.server = this.app.listen(httpPort);
    logger.info(`Started HTTP public api on port ${httpPort}`);
  }

  private shutdownApp() {
    this.server.close();
  }

  private getHTTPSendTransactionRequestHandler(): express.RequestHandler {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const body = JsonBuffer.parseJsonWithBuffers(req.body);

      const input: types.SendTransactionInput = {
        transaction: {
          header: {
            version: _.get(body, "header.version"),
            sender: bs58DecodeRawAddress(_.get(body, "header.senderAddressBase58")),
            timestamp: _.get(body, "header.timestamp"),
            contractAddress: bs58DecodeRawAddress(_.get(body, "header.contractAddressBase58")),
          },
          payload: _.get(body, "payload")
        }
      };

      try {
        await this.publicApi.sendTransaction(input);
        // placeholder value instead of transaction receipt
        res.json({ result: "ok" });
      } catch (err) {
        logger.error(`HTTP API could not send a transcation: ${err.toString()}`);
        res.sendStatus(500);
      }
    };
  }

  private getHTTPCallContractRequestHandler(): express.RequestHandler {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const body = JsonBuffer.parseJsonWithBuffers(req.body);

      const input: types.CallContractInput = {
        contractAddress: bs58DecodeRawAddress(body.contractAddressBase58),
        payload: body.payload,
        sender: bs58DecodeRawAddress(body.senderAddressBase58)
      };

      try {
        const result = JSON.parse(await this.publicApi.callContract(input));
        res.json({ result });
      } catch (err) {
        console.log(err);
        logger.error(`HTTP API could not call a contract: ${err.toString()}`);
        res.sendStatus(500);
      }
    };
  }
}
