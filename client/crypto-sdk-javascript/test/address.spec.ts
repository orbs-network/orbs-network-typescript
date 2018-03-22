import { expect } from "chai";

import { Address, ED25519Key } from "../src/index";

describe("an address", () => {
  it("is properly initialized by a public key", async () => {
    const publicKey = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65";
    const virtualChainId = "640ed3";
    const networkId = Address.MAIN_NETWORK_ID;
    const address = new Address(publicKey, virtualChainId, networkId);

    expect(address.publicKey).to.equal(publicKey);
    expect(address.networkId).to.equal(Address.MAIN_NETWORK_ID);
    expect(address.version).to.equal(0);
    expect(address.virtualChainId).to.equal("640ed3");
    expect(address.accountId).to.equal("c13052d8208230a58ab363708c08e78f1125f488");
    expect(address.checksum).to.equal("61f04bfc");
    expect(address.toString()).to.equal("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu1");

    const publicKey2 = "7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6";
    const virtualChainId2 = "9012ca";
    const networkId2 = Address.TEST_NETWORK_ID;
    const address2 = new Address(publicKey2, virtualChainId2, networkId2);

    expect(address2.publicKey).to.equal(publicKey2);
    expect(address2.networkId).to.equal(Address.TEST_NETWORK_ID);
    expect(address2.version).to.equal(0);
    expect(address2.virtualChainId).to.equal("9012ca");
    expect(address2.accountId).to.equal("44068acc1b9ffc072694b684fc11ff229aff0b28");
    expect(address2.checksum).to.equal("d971f700");
    expect(address2.toString()).to.equal("T1LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMpsdEej");
  });

  it("is properly initialized by a ed25519 public key", async () => {
    const key1 = new ED25519Key("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65");
    const virtualChainId = "640ed3";
    const networkId = Address.MAIN_NETWORK_ID;
    const address = new Address(key1.publicKey, virtualChainId, networkId);

    expect(address.publicKey).to.equal(key1.publicKey);
    expect(address.networkId).to.equal(Address.MAIN_NETWORK_ID);
    expect(address.version).to.equal(0);
    expect(address.virtualChainId).to.equal("640ed3");
    expect(address.accountId).to.equal("c13052d8208230a58ab363708c08e78f1125f488");
    expect(address.checksum).to.equal("61f04bfc");
    expect(address.toString()).to.equal("M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu1");

    const key2 = new ED25519Key("7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6");
    const virtualChainId2 = "9012ca";
    const networkId2 = Address.TEST_NETWORK_ID;
    const address2 = new Address(key2.publicKey, virtualChainId2, networkId2);

    expect(address2.publicKey).to.equal(key2.publicKey);
    expect(address2.networkId).to.equal(Address.TEST_NETWORK_ID);
    expect(address2.version).to.equal(0);
    expect(address2.virtualChainId).to.equal("9012ca");
    expect(address2.accountId).to.equal("44068acc1b9ffc072694b684fc11ff229aff0b28");
    expect(address2.checksum).to.equal("d971f700");
    expect(address2.toString()).to.equal("T1LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMpsdEej");
  });

  it("is properly initialized by a random public key", async () => {
    const key1 = new ED25519Key();
    const virtualChainId = "640ed3";
    const networkId = Address.MAIN_NETWORK_ID;
    const address = new Address(key1.publicKey, virtualChainId, networkId);

    expect(address.publicKey).to.equal(key1.publicKey);
    expect(address.networkId).to.equal(Address.MAIN_NETWORK_ID);
    expect(address.version).to.equal(0);
    expect(address.virtualChainId).to.equal("640ed3");


    const key2 = new ED25519Key();
    const virtualChainId2 = "9012ca";
    const networkId2 = Address.TEST_NETWORK_ID;
    const address2 = new Address(key2.publicKey, virtualChainId2, networkId2);

    expect(address2.publicKey).to.equal(key2.publicKey);
    expect(address2.networkId).to.equal(Address.TEST_NETWORK_ID);
    expect(address2.version).to.equal(0);
    expect(address2.virtualChainId).to.equal("9012ca");
  });
});
