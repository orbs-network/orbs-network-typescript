import { expect } from "chai";

import { ED25519Key } from "../src/index";

describe("a ed25519 key", () => {
  it("is properly initialized by a public key", async () => {
    const publicKey = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65";
    const key1 = new ED25519Key(publicKey);

    expect(key1.publicKey).to.equal(publicKey);

    const publicKey2 = "7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6";
    const key2 = new ED25519Key(publicKey2);

    expect(key2.publicKey).to.equal(publicKey2);
  });

  it("is randomly generated", async () => {
    const key1 = new ED25519Key();
    const key2 = new ED25519Key();
    const key3 = new ED25519Key();

    expect(key1.publicKey).to.have.length(64);
    expect(key2.publicKey).to.have.length(64);
    expect(key3.publicKey).to.have.length(64);

    expect(key1.publicKey).not.to.be.equal(key2.publicKey);
    expect(key2.publicKey).not.to.be.equal(key3.publicKey);
  });
});
