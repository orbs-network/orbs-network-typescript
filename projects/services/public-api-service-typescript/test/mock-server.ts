import * as chai from "chai";
import * as express from "express";
import { OrbsAPICallContractRequest, OrbsAPISendTransactionRequest, OrbsAPIGetTransactionStatusRequest } from "../../../../client/client-sdk-javascript/src/orbs-api-interface";
import * as _ from "lodash";
import { diffString } from "json-diff";

import * as cp from "child_process";
import * as path from "path";

const deepEquals = require("deep-equal");

const { expect } = chai;

function failWith(message: string, status: number) {
  const err: any = new Error(message);
  err["status"] = status;
  return err;
}

export default function createMockServer(requestStubs: RequestStub[]): express.Application {
  const app = express();

  app.use(express.json());

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const matchingStub = _.find(requestStubs, (stub: RequestStub) => req.path == stub.path);
    if (matchingStub) {
      const expectedJson = JSON.parse(matchingStub.requestBody);
      if (deepEquals(req.body, expectedJson)) {
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(matchingStub.responseBody);
      } else {
        next(failWith(`Path ${matchingStub.path} mismatch: [${diffString(expectedJson, req.body)}]`, 400));
      }
    } else {
      next(failWith(`No stub found for path ${req.path}`, 404));
    }
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(err["status"] || 500);
    res.render("error", {
      message: err.message,
      error: err
    });
  });

  return app;
}

export class RequestStub {
  path: string;
  requestBody: string;
  responseBody: string;

  constructor(path: string, request: string, response: string) {
    this.path = path;
    this.requestBody = request;
    this.responseBody = response;
  }

}

export function runMockServer(port: number, stubs: RequestStub[]): Promise<cp.ChildProcess> {
  const child = cp.fork(path.resolve(__dirname, "run-mock-server.js"), ["--port", port.toString(), "--stubs", JSON.stringify(stubs)], {stdio: ["ipc"]});
  return new Promise((resolve) => {
    child.stdout.on("data", (data) => {
      if (!!data.toString().indexOf(port.toString())) {
        resolve(child);
      }
    });
  });
}
