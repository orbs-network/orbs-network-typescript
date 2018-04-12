import * as chai from "chai";
import * as express from "express";
import { Transaction, CallContractInput } from "orbs-interfaces";

const { expect } = chai;

export default function createMockServer(expectedTransaction: Transaction, expectedContract: CallContractInput): express.Application {
  const app = express();

  app.use(express.json());

  app.use("/public/sendTransaction", (req, res) => {
    expect(req.body.transaction.body).to.be.eql(expectedTransaction.body);

    res.json({ result: "ok" });
  });

  app.use("/public/callContract", (req, res) => {
    expect(req.body.contractAddress).to.be.eql({ address: "contractAddress" });
    expect(req.body.payload).to.be.eql("some-payload");

    res.json({ result: "some-answer" });
  });

  return app;
}
