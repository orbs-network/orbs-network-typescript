import "mocha";
import { expect } from "chai";
import java from "./java-sdk-helper";

describe("java bindings", () => {
  it("loads Address class from our jar", () => {
    java.import("com.orbs.cryptosdk.Address");
    const publicKey = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65";
    const vcid = "640ed3";
    const address = java.newInstanceSync("com.orbs.cryptosdk.Address", publicKey, vcid, "T");
    expect(address.toString()).to.be.ok;
  });
});
