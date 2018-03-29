import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as mocha from "mocha";

const { expect } = chai;

describe("setup-tests", () => {
    it("should-pass", () => {
        expect(1).to.be.ok;
    });
});