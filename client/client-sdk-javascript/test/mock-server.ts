import * as chai from "chai";
import * as express from "express";
import { OrbsAPICallContractRequest, OrbsAPISendTransactionRequest } from "../src/orbs-api-interface";


const { expect } = chai;

export default function createMockServer(
  expectedSendTransactionRequest: OrbsAPISendTransactionRequest,
  expectedCallContractRequest: OrbsAPICallContractRequest): express.Application {
  const app = express();

  app.use(express.json());

  app.use("/public/sendTransaction", (req: express.Request, res: express.Response) => {
    // TODO: check header
    expect(req.body.payload).to.be.eql(expectedSendTransactionRequest.payload);
    expect(req.body.header.senderAddressBase58).to.be.eql(expectedSendTransactionRequest.header.senderAddressBase58);
    expect(req.body.header.contractAddressBase58).to.be.eql(expectedSendTransactionRequest.header.contractAddressBase58);

    res.json({ result: "ok" });
  });

  app.use("/public/callContract", (req: express.Request, res: express.Response) => {
    // TODO: check sender
    expect(req.body).to.be.eql(expectedCallContractRequest);

    res.json({ result: "some-answer" });
  });

  return app;
}
