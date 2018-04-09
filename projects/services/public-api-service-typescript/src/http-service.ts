import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig, JsonBuffer } from "orbs-core-library";
import { TransactionHandler, TransactionHandlerConfig } from "orbs-core-library";
import { PublicApiServiceConfig, ConstantTransactionHandlerConfig } from "./service";
import { PublicApi } from "orbs-core-library";
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

  public constructor(virtualMachine: types.VirtualMachineClient, transactionPool: types.TransactionPoolClient, subscriptionManager: types.SubscriptionManagerClient, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.transactionHandler = new TransactionHandler(transactionPool, subscriptionManager, new ConstantTransactionHandlerConfig((<PublicApiHTTPServiceConfig>serviceConfig).validateSubscription));

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
            version: _.get(body, "transaction.header.version"),
            sender: _.get(body, "transaction.header.sender"),
            timestamp: _.get(body, "transaction.header.timestamp")
          },
          body: {
            contractAddress: {
              address: _.get(body, "transaction.body.contractAddress.address")
            },
            payload: _.get(body, "transaction.body.payload")
          }
        },
        transactionSubscriptionAppendix: {
          subscriptionKey: _.get(body, "transactionSubscriptionAppendix.subscriptionKey")
        }
      };

      const result = await this.publicApi.sendTransaction(input);
      res.send(result);
    };
  }

  private getHTTPCallContractRequestHandler(): express.RequestHandler {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const body = JsonBuffer.parseJsonWithBuffers(req.body);

      const input: types.CallContractInput = {
        contractAddress: body.contractAddress,
        payload: body.payload,
        sender: body.sender
      };

      const result = await this.publicApi.callContract(input);
      res.send(result);
    };
  }
}
