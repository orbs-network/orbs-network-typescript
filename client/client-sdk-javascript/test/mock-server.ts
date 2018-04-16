import * as chai from "chai";
import * as express from "express";
import { Transaction, CallContractInput } from "orbs-interfaces";

const { expect } = chai;

export default function createMockServer(expectedTransaction: Transaction, expectedContract: CallContractInput): express.Application {
  const app = express();

  app.use(express.json());

  app.use("/public/sendTransaction", (req: express.Request, res: express.Response) => {
    // TODO: check header
    expect(req.body.transaction.body).to.be.eql(expectedTransaction.body);

    res.json({ result: "ok" });
  });

  app.use("/public/callContract", (req: express.Request, res: express.Response) => {
    // TODO: check sender
    expect(req.body.contractAddress).to.be.eql(expectedContract.contractAddress);
    expect(req.body.payload).to.be.eql(expectedContract.payload);

    res.json({ result: "some-answer" });
  });

  return app;
}
