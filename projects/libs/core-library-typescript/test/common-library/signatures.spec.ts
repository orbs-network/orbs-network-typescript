import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
import { Signatures } from "../../src/common-library";
import * as sinon from "sinon";
import * as shell from "shelljs";

chai.use(sinonChai);

describe("Signatures", () => {
  before(() => {
    shell.exec(`
      rm -rf ${__dirname}/test-private-keys
      mkdir -p ${__dirname}/test-private-keys

      rm -rf ${__dirname}/test-public-keys
      mkdir -p ${__dirname}/test-public-keys

      ssh-keygen -t rsa -b 4096 -N "" -f ${__dirname}/test-private-keys/secret-message-key
      ssh-keygen -f ${__dirname}/test-private-keys/secret-message-key.pub -e -m pem > ${__dirname}/test-public-keys/secret-message-key
    `);
  });

  describe("#signMessage", () => {
    it("returns a signed object", () => {
      const signatures = new Signatures({
        privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
      });

      expect(signatures.sign({
        message: "Hello",
        anotherMessage: "world"
      })).not.to.be.empty;
    });

    it("fails if private key is not found", () => {
      const signatures = new Signatures({});

      expect(() => {
        signatures.sign({
          message: "Hello",
          anotherMessage: "world"
        });
      }).to.throw("Private key not found");
    });
  });

  describe("#verifyMessage", () => {
    it("verifies message by public key", () => {
      const signatures = new Signatures({
        privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
      });

      const message = {
        message: "Hello",
        anotherMessage: "world"
      };

      const signature = signatures.sign(message);

      const signatureVerifier = new Signatures({
        publicKeysPath: `${__dirname}/test-public-keys`
      });

      const keyName = "secret-message-key";

      expect(signatureVerifier.verify(message, signature, keyName)).to.be.true;
    });

    it("works with buffers", () => {
      const signatures = new Signatures({
        privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
      });

      const message = Buffer.from([0, 1]);

      const signature = signatures.sign(message);

      const signatureVerifier = new Signatures({
        publicKeysPath: `${__dirname}/test-public-keys`
      });

      const keyName = "secret-message-key";

      expect(signatureVerifier.verify(message, signature, keyName)).to.be.true;
    });

    it("fails if public key is not found", () => {
      const signatures = new Signatures({
        privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
      });

      const message = {
        message: "Hello",
        anotherMessage: "world"
      };

      const signature = signatures.sign(message);

      const signatureVerifier = new Signatures({
        publicKeysPath: `${__dirname}/test-public-keys`
      });

      const keyName = "fake-message-key";

      expect(() => signatureVerifier.verify(message, signature, keyName)).to.throw("No public key found: fake-message-key");
    });
  });
});
