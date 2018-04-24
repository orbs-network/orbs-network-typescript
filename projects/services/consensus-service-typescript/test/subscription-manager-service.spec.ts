import * as mocha from "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as getPort from "get-port";
import { stubInterface } from "ts-sinon";

import { types, ErrorHandler, GRPCServerBuilder, grpc, logger, Gossip } from "orbs-core-library";


const { expect } = chai;

ErrorHandler.setup();

logger.configure({ level: "debug" });

describe("subscription manager service tests", function() {
    it("should get subscription status", () => {
        expect(1).to.be.equal(2);
    });
});