import { expect } from "chai";
import { eddsa } from "elliptic";

import { ED25519Key } from "../src/index";

describe("an ed25519 key", () => {
  it("is properly initialized by a public key", async () => {
    const publicKey1 = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65";
    const key1 = new ED25519Key(publicKey1);

    expect(key1.publicKey).to.equal(publicKey1);
    expect(key1.hasPrivateKey).to.equal(false);

    const publicKey2 = "7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6";
    const key2 = new ED25519Key(publicKey2);
    expect(key2.hasPrivateKey).to.equal(false);

    expect(key2.publicKey).to.equal(publicKey2);
  });

  it("is properly initialized by a public key and private key", async () => {
    const publicKey1 = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b";
    const privateKey1 = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";
    const key1 = new ED25519Key(publicKey1, privateKey1);
    expect(key1.publicKey).to.equal(publicKey1);
    expect(key1.hasPrivateKey).to.equal(true);

    const publicKey2 = "f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3";
    const privateKey2 = "031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935";
    const key2 = new ED25519Key(publicKey2, privateKey2);
    expect(key2.publicKey).to.equal(publicKey2);
    expect(key2.hasPrivateKey).to.equal(true);
  });

  it("is randomly generated", async () => {
    const key1 = new ED25519Key();
    const key2 = new ED25519Key();
    const key3 = new ED25519Key();

    expect(key1.publicKey).to.have.length(64);
    expect(key1.hasPrivateKey).to.equal(true);
    expect(key2.publicKey).to.have.length(64);
    expect(key2.hasPrivateKey).to.equal(true);
    expect(key3.publicKey).to.have.length(64);
    expect(key3.hasPrivateKey).to.equal(true);

    expect(key1.publicKey).not.to.be.equal(key2.publicKey);
    expect(key2.publicKey).not.to.be.equal(key3.publicKey);
  });

  it("can sign and verify messages", async () => {
    const message1 = Buffer.from("Hello World!");
    const publicKey1 = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b";
    const privateKey1 = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";
    const key1 = new ED25519Key(publicKey1, privateKey1);
    const signature1 = key1.sign(message1);
    expect(key1.verify(message1, signature1)).to.be.true;

    const message2 = Buffer.from("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean - Paul Sartre, Nobel Prize winner.");
    const publicKey2 = "f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3";
    const privateKey2 = "031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935";
    const key2 = new ED25519Key(publicKey2, privateKey2);
    const signature2 = key2.sign(message2);
    expect(key2.verify(message2, signature2)).to.be.true;

    expect(key1.verify(message2, signature1)).to.be.false;
    expect(key1.verify(message1, signature2)).to.be.false;
    expect(key1.verify(message2, signature2)).to.be.false;
    expect(key2.verify(message2, signature1)).to.be.false;
    expect(key2.verify(message1, signature2)).to.be.false;
    expect(key2.verify(message1, signature1)).to.be.false;
  });

  it("can sign messages which can be verified externally", async () => {
    const ec = new eddsa("ed25519");

    const message1 = Buffer.from("Hello World!");
    const publicKey1 = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b";
    const privateKey1 = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";
    const key1 = new ED25519Key(publicKey1, privateKey1);
    const signature1: Buffer = key1.sign(message1);

    const ecKey1 = ec.keyFromPublic(publicKey1);
    expect(ecKey1.verify([...message1], [...signature1])).to.be.true;

    const message2 = Buffer.from("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean - Paul Sartre, Nobel Prize winner.");
    const publicKey2 = "f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3";
    const privateKey2 = "031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935";
    const key2 = new ED25519Key(publicKey2, privateKey2);
    const signature2: Buffer = key2.sign(message2);

    const ecKey2 = ec.keyFromPublic(publicKey2);
    expect(ecKey2.verify([...message2], [...signature2])).to.be.true;

  });

  it("can verify externally signed messages", async () => {
    const ec = new eddsa("ed25519");

    const message1 = Buffer.from("Hello World!");
    const publicKey1 = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b";
    const privateKey1 = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";

    const ecKey1 = ec.keyFromSecret(privateKey1);
    const ecSignature1 = Buffer.from(ecKey1.sign([...message1]).toBytes());

    const key1 = new ED25519Key(publicKey1);
    expect(key1.verify(message1, ecSignature1)).to.be.true;

    const message2 = Buffer.from("If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean - Paul Sartre, Nobel Prize winner.");
    const publicKey2 = "f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3";
    const privateKey2 = "031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935";

    const ecKey2 = ec.keyFromSecret(privateKey2);
    const ecSignature2 = Buffer.from(ecKey2.sign([...message2]).toBytes());

    const key2 = new ED25519Key(publicKey2);
    expect(key2.verify(message2, ecSignature2)).to.be.true;
  });
});
