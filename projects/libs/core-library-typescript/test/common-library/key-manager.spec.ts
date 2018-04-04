import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
import { KeyManager } from "../../src/common-library";
import * as sinon from "sinon";
import * as shell from "shelljs";

chai.use(sinonChai);

describe("KeyManager", () => {
  before(async function() {
    this.timeout(4000);

    shell.exec(`
      rm -rf ${__dirname}/test-private-keys
      mkdir -p ${__dirname}/test-private-keys

      rm -rf ${__dirname}/test-public-keys
      mkdir -p ${__dirname}/test-public-keys

      ssh-keygen -t rsa -b 4096 -N "" -f ${__dirname}/test-private-keys/secret-message-key
      ssh-keygen -f ${__dirname}/test-private-keys/secret-message-key.pub -e -m pem > ${__dirname}/test-public-keys/secret-message-key
    `);
  });

  describe("#constructor", () => {
    it("fails to instantiate if no keys were passed to constructor", () => {
      expect(() => new KeyManager({})).to.throw("Neither private key nor public keys are provided!");
    });
  });

  describe("#signMessage", () => {
    it("returns a signed object", () => {
      const keyManager = new KeyManager({
        privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
      });

      expect(keyManager.sign({
        message: "Hello",
        anotherMessage: "world"
      })).not.to.be.empty;
    });

    it("fails if private key is not found", () => {
      expect(() => {
        new KeyManager({
          publicKeysPath: `${__dirname}/test-public-keys/`
        }).sign({
          message: "Hello",
          anotherMessage: "world"
        });
      }).to.throw("Private key not found");
    });
  });

  describe("#verifyMessage", () => {
    it("verifies message by public key", () => {
      const keyManager = new KeyManager({
        privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
      });

      const message = {
        message: "Hello",
        anotherMessage: "world"
      };

      const signature = keyManager.sign(message);

      const signatureVerifier = new KeyManager({
        publicKeysPath: `${__dirname}/test-public-keys`
      });

      const keyName = "secret-message-key";

      expect(signatureVerifier.verify(message, signature, keyName)).to.be.true;
    });

    it("works with buffers", () => {
      const keyManager = new KeyManager({
        privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
      });

      const message = Buffer.from([0, 1]);

      const signature = keyManager.sign(message);

      const signatureVerifier = new KeyManager({
        publicKeysPath: `${__dirname}/test-public-keys`
      });

      const keyName = "secret-message-key";

      expect(signatureVerifier.verify(message, signature, keyName)).to.be.true;
    });

    it("fails if public key is not found", () => {
      const keyManager = new KeyManager({
        privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
      });

      const message = {
        message: "Hello",
        anotherMessage: "world"
      };

      const signature = keyManager.sign(message);

      const signatureVerifier = new KeyManager({
        publicKeysPath: `${__dirname}/test-public-keys`
      });

      const keyName = "fake-message-key";

      expect(() => signatureVerifier.verify(message, signature, keyName)).to.throw("No public key found: fake-message-key");
    });
  });
});
