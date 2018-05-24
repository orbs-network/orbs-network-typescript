import * as _ from "lodash";

import { StartupCheck, StartupCheckRunner, StartupCheckRunnerDefault, StartupStatus, STARTUP_STATUS } from "orbs-core-library";
import { logger, types, Service, ServiceConfig, JsonBuffer, PublicApi, TransactionHandler, bs58DecodeRawAddress } from "orbs-core-library";
import * as express from "express";
import { Server } from "http";
import * as bodyParser from "body-parser";

export interface PublicApiHTTPServiceConfig extends ServiceConfig {
  validateSubscription: boolean;
  httpPort: number;
  httpManagementPort: number;
}

export default class PublicApiHTTPService extends Service {
  private SERVICE_NAME = "public-api-service";
  private publicApi: PublicApi;
  private transactionHandler: TransactionHandler;
  private app: express.Express;
  private server: Server;
  private managementServer: any;

  public constructor(virtualMachine: types.VirtualMachineClient, transactionPool: types.TransactionPoolClient, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.transactionHandler = new TransactionHandler(transactionPool);

    this.publicApi = new PublicApi(this.transactionHandler, virtualMachine, transactionPool);
  }

  async initialize() {
    this.initializeApp();
    const startupCheckRunner = new StartupCheckRunner(this.SERVICE_NAME, [<StartupCheck>this.publicApi]);
    this.managementServer = this.startManagementServer(startupCheckRunner);
    logger.info("PublicApiService.startManagementServer started");
  }

  async shutdown() {
    this.shutdownApp();
    if (this.managementServer) {
      this.managementServer.close();
    }
  }

  private initializeApp() {
    this.app = express();
    this.app.use(bodyParser.raw({ type: "*/*" }));

    this.app.use("/public/sendTransaction", this.getHTTPSendTransactionRequestHandler());
    this.app.use("/public/callContract", this.getHTTPCallContractRequestHandler());
    this.app.use("/public/getTransactionStatus", this.getHTTPGetTransactionStatusRequestHandler());

    const { httpPort } = (<PublicApiHTTPServiceConfig>this.config);
    this.server = this.app.listen(httpPort);
    logger.info(`Started HTTP public api on port ${httpPort}`);

  }

  // TODO Unify this code with GRPCServer.ts
  private startManagementServer(startupCheckRunner: StartupCheckRunner): any {
    logger.info("PublicApiService.startManagementServer starts");
    const { httpManagementPort } = (<PublicApiHTTPServiceConfig>this.config);
    const mgmtApp = express();
    mgmtApp.get("/admin/startupCheck", (req: express.Request, res: express.Response) => {
      startupCheckRunner.run()
        .then((result: StartupStatus) => {
          const httpCode = result.status === STARTUP_STATUS.OK ? 200 : 503;
          return res.status(httpCode).send(result);
        });
    });

    const mgmtServer = mgmtApp.listen(httpManagementPort);
    logger.info(`Started HTTP public api management server on port ${httpManagementPort}`);
    return mgmtServer;
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
          payload: _.get(body, "payload"),
          signatureData: body.signatureData && {
            publicKey: Buffer.from(_.get(body, "signatureData.publicKeyHex"), "hex"),
            signature: Buffer.from(_.get(body, "signatureData.signatureHex"), "hex")
          }
        }
      };

      try {
        const txid = await this.publicApi.sendTransaction(input);
        // placeholder value instead of transaction receipt
        res.json({ transactionId: txid });
      } catch (err) {
        logger.error(`HTTP API could not send a transaction: ${err.toString()}`);
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

  private getHTTPGetTransactionStatusRequestHandler(): express.RequestHandler {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const body = JsonBuffer.parseJsonWithBuffers(req.body);

      const input: types.GetTransactionStatusInput = {
        txid: body.txid
      };

      try {
        const { status, receipt } = await this.publicApi.getTransactionStatus(input);
        switch (status) {
          case types.TransactionStatus.NOT_FOUND:
            res.sendStatus(404);
            break;
          case types.TransactionStatus.PENDING:
            res.json({
              status: "PENDING"
            });
            break;
          case types.TransactionStatus.COMMITTED:
            res.json({
              status: "COMMITTED",
              receipt: {
                success: receipt.success
              }
            });
            break;
          default:
            throw new Error(`Unexpected transaction status with value ${status}`);
        }
      } catch (err) {
        console.log(err);
        logger.error(`HTTP API could not get : ${err.toString()}`);
        res.sendStatus(500);
      }
    };
  }
}
