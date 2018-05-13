import * as chai from "chai";
import * as express from "express";
import { OrbsAPICallContractRequest, OrbsAPISendTransactionRequest, OrbsAPIGetTransactionStatusRequest } from "../src/orbs-api-interface";


const { expect } = chai;

export default function createMockServer(
  expectedSendTransactionRequest: OrbsAPISendTransactionRequest,
  expectedCallContractRequest: OrbsAPICallContractRequest,
  expectedGetTransactionStatusRequest: OrbsAPIGetTransactionStatusRequest,
): express.Application {
  const app = express();

  app.use(express.json());

  app.post("/public/sendTransaction", (req: express.Request, res: express.Response) => {
    // TODO: check header
    expect(req.body.payload).to.be.eql(expectedSendTransactionRequest.payload);
    expect(req.body.header.senderAddressBase58).to.be.eql(expectedSendTransactionRequest.header.senderAddressBase58);
    expect(req.body.header.contractAddressBase58).to.be.eql(expectedSendTransactionRequest.header.contractAddressBase58);
    res.json({ result: "ok" });
    res.end();
  });

  app.post("/public/callContract", (req: express.Request, res: express.Response) => {
    // TODO: check sender
    expect(req.body).to.be.eql(expectedCallContractRequest);

    res.json({ result: "some-answer" });
    res.end();
  });

  app.get("/test", (req: express.Request, res: express.Response) => {
    res.json({ result: "ok"});
    res.end();
  });

  app.use("/public/getTransactionStatus", (req: express.Request, res: express.Response) => {
    expect(req.body).to.be.eql(expectedGetTransactionStatusRequest);

    res.json({ status: "COMMITTED", receipt: { success: true} });
  });

  return app;
}
