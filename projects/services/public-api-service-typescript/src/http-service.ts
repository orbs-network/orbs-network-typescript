import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { TransactionHandler, TransactionHandlerConfig } from "orbs-core-library";
import { PublicApiServiceConfig, ConstantTransactionHandlerConfig } from "./service";
import { PublicApi } from "orbs-core-library";
import * as express from "express";
import { Server } from "http";



export default class PublicApiHTTPService extends Service {
  private publicApi: PublicApi;
  private transactionHandler: TransactionHandler;
  private app: express.Express;
  private server: Server;

  public constructor(virtualMachine: types.VirtualMachineClient, transactionPool: types.TransactionPoolClient, subscriptionManager: types.SubscriptionManagerClient, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.transactionHandler = new TransactionHandler(transactionPool, subscriptionManager, new ConstantTransactionHandlerConfig((<PublicApiServiceConfig>serviceConfig).validateSubscription));

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
    this.app.use(express.json());

    this.app.use("/public/sendTransaction", this.getHTTPSendTransactionRequestHandler());
    this.app.use("/public/callContract", this.getHTTPCallContractRequestHandler());

    this.server = this.app.listen((<PublicApiServiceConfig>this.config).httpPort);
  }

  private shutdownApp() {
    this.server.close();
  }

  private getHTTPSendTransactionRequestHandler(): express.RequestHandler {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const input: types.SendTransactionInput = {
        transaction: {
          header: {
            version: _.get(req.body, "transaction.header.version"),
            sender: _.get(req.body, "transaction.header.sender"),
            timestamp: _.get(req.body, "transaction.header.timestamp")
          },
          body: {
            contractAddress: {
              address: _.get(req.body, "transaction.body.contractAddress")
            },
            payload: _.get(req.body, "transaction.body.payload")
          }
        },
        transactionSubscriptionAppendix: {
          subscriptionKey: _.get(req.body, "transactionSubscriptionAppendix.subscriptionKey")
        }
      };

      const result = await this.publicApi.sendTransaction(input);
      res.send(result);
    };
  }

  private getHTTPCallContractRequestHandler(): express.RequestHandler {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const input: types.CallContractInput = {
        contractAddress: req.body.contractAddress,
        payload: req.body.payload,
        sender: req.body.sender
      };

      const result = await this.publicApi.callContract(input);
      res.send(result);
    };
  }
}
