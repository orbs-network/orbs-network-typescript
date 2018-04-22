import * as mocha from "mocha";
import * as chai from "chai";
import { stubInterface } from "ts-sinon";

import { types, BlockUtils, ErrorHandler, GRPCServerBuilder, grpc, logger, createContractAddress } from "orbs-core-library";
import { BlockStorageClient, StateStorageClient } from "orbs-interfaces";

const { expect } = chai;

describe("sidechain connector service tests", function () {
    it("should fail", () => {
        expect(1).to.be.equal(2);
    });
});