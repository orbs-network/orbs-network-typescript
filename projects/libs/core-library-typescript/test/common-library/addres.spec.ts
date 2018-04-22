import { expect } from "chai";

import { Address } from "../../src/common-library";
import { isSymbol } from "util";

describe("an address", () => {
  it("is properly initialized by a public key #1", () => {
    const publicKey = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65";
    const virtualChainId = "640ed3";
    const networkId = Address.MAIN_NETWORK_ID;
    const address = new Address(Buffer.from(publicKey, "hex"), virtualChainId, networkId);

    expect(address.publicKey.toString("hex")).to.equal(publicKey);
    expect(address.networkId).to.equal(Address.MAIN_NETWORK_ID);
    expect(address.version).to.equal(0);
    expect(address.virtualChainId).to.equal("640ed3");
    expect(address.accountId.toString("hex")).to.equal("c13052d8208230a58ab363708c08e78f1125f488");
    expect(address.checksum).to.equal(0x0b4af4d2);
    expect(address.toBase58()).to.equal("M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qqa1");
  });

  it("is properly initialized by public key #2", () => {
    const publicKey2 = "7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6";
    const virtualChainId2 = "9012ca";
    const networkId2 = Address.TEST_NETWORK_ID;
    const address2 = new Address(Buffer.from(publicKey2, "hex"), virtualChainId2, networkId2);

    expect(address2.publicKey.toString("hex")).to.equal(publicKey2);
    expect(address2.networkId).to.equal(Address.TEST_NETWORK_ID);
    expect(address2.version).to.equal(0);
    expect(address2.virtualChainId).to.equal("9012ca");
    expect(address2.accountId.toString("hex")).to.equal("44068acc1b9ffc072694b684fc11ff229aff0b28");
    expect(address2.checksum).to.equal(0x258c93e8);
    expect(address2.toBase58()).to.equal("T00LUPVrDh4SDHggRBJHpT8hiBb6FEf2rMkGvQPR");
  });

  it("serialization/deserialization works well", () => {
    const rawAddressHex = "4d00640ed3c13052d8208230a58ab363708c08e78f1125f4880b4af4d2";
    const address = Address.fromBuffer(Buffer.from(rawAddressHex, "hex"), undefined, false);
    expect(address.toBuffer().toString("hex")).to.equal(rawAddressHex);
  });
  it("deserialization throws an error if checksum is incorrect", () => {
    const rawAddressWithBadChecksumHex = "4d00640ed3c13052d8208230a58ab363708c08e78f1125f4880b4af4d1";
    const fromBufferWithBadChecksum = () => Address.fromBuffer(Buffer.from(rawAddressWithBadChecksumHex, "hex"), undefined, true);
    expect(fromBufferWithBadChecksum).to.throw();
  });
  it("deserialization throws an error if address doesn't match public key", () => {
    const rawAddressHex = "4d00640ed3c13052d8208230a58ab363708c08e78f1125f4880b4af4d2";
    const unmatchedPublicKey = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c64";
    const fromBufferWithBadPublicKey = () => Address.fromBuffer(Buffer.from(rawAddressHex, "hex"), Buffer.from(unmatchedPublicKey, "hex"), true);
    expect(fromBufferWithBadPublicKey).to.throw();
  });
  it("address construction to fail if public key doesn't match account ID", () => {
    const publicKey = "7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6";
    const virtualChainId = "9012ca";
    const networkId = Address.TEST_NETWORK_ID;
    const address = new Address(Buffer.from(publicKey, "hex"), virtualChainId, networkId);
    const badAccountId = "c13052d8208230a58ab363708c08e78f11250000";
    const addressConstructionWithBadAccountId = () => {
      return new Address(Buffer.from(publicKey, "hex"), virtualChainId, networkId, Buffer.from(badAccountId, "hex"));
    };
    expect(badAccountId).to.not.deep.equal(address.accountId);
    expect(addressConstructionWithBadAccountId).to.throw();
  });
});
