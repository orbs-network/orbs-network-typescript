/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as chai from "chai";
import * as express from "express";
import { OrbsAPICallContractRequest, OrbsAPISendTransactionRequest, OrbsAPIGetTransactionStatusRequest } from "../../../../client/client-contract-test/src/orbs-api-interface";
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

const KnownEndpoints: string[] = [
  "/public/sendTransaction",
  "/public/callContract",
  "/public/getTransactionStatus"
];
function validateStubEndpoints(requestStubs: RequestStub[]) {
  return new Promise((resolve, reject) => {
    requestStubs.forEach(stub => {
      if (!stub || !stub.path || KnownEndpoints.indexOf(stub.path) === -1) {
        reject(new Error(
        `**************************** DANGER WILL ROBINSON *********************************
         The Mock HTTP API server was stubbed with an unknown endpoint ${stub.path}
         This might indicate that the client code under test is trying to access an endpoint unsupported by the Orbs Public API
         If you're attempting to change an endpoint in the HTTP API, don't - there are probably clients out there using this endpoint!
         The process to introduce a new endpoint is as follows:
         1) Add new endpoint to the HTTP API test, retaining tests for the old endpoint
         2) Add it to the HTTP API implementation
         3) Add it to KnownEndpoints in the Mock HTTP API
         4) Change new client versions to use the new endpoint
         5) Add deprecation warnings on usages of the old endpoint
         6) Wait until it's safe to assume theere are no clients accessing the old endpoint before removing it

         Known endpoints are:
         ${KnownEndpoints.map(endpoint => " * " + endpoint).join("\n")}
        `));
      }
    });

    resolve(requestStubs);
  });

}

export default function createMockServer(requestStubs: RequestStub[]): Promise<express.Application> {
  return validateStubEndpoints(requestStubs).then(validStubs => {
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
  });
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
  const hasEchoedRunningPort = (data: any) => data.toString().indexOf(port.toString()) !== -1;

  const child = cp.fork(path.resolve(__dirname, "run-mock-server.js"), ["--port", port.toString(), "--stubs", JSON.stringify(stubs)], {stdio: ["ipc"]});
  return new Promise((resolve, reject) => {
    child.stdout.on("data", (data) => {
      if (hasEchoedRunningPort(data)) {
        resolve(child);
      } else {
        reject(new Error(data.toString()));
      }
    });
  });
}
