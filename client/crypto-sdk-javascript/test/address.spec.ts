import { expect } from "chai";

import { Address } from "../src/index";

describe("an address", () => {
  it("is properly initialized by a public key", async () => {
    const publicKey = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65";
    const address = new Address(publicKey);

    expect(address.toString()).to.equal("1JcVJcBXwqeVcC8T2nTpG2dT6xGzhdrHai");

    const publicKey2 = "7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6";
    const address2 = new Address(publicKey2);

    expect(address2.toString()).to.equal("17Cgnby8KJC9ZwF8dRgYCKnT1ZXDPNYSkB");
  });
});
