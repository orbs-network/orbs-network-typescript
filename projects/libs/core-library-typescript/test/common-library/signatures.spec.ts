import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
import Signatures from "../../src/common-library";
import * as sinon from "sinon";

chai.use(sinonChai);

describe("Signatures", () => {
  describe("#signMessage", () => {
    it("returns a signed object", () => {
      const signatures = new Signatures({
        message: {
          privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
        }
      });

      expect(signatures.signMessage({
        message: "Hello",
        anotherMessage: "world"
      }).signature).to.not.be.empty;
    });
  });

  describe("#verifyMessage", () => {
    it("verifies message by public key", () => {
      const signatures = new Signatures({
        message: {
          privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
        }
      });

      const signedMessage = signatures.signMessage({
        message: "Hello",
        anotherMessage: "world"
      });

      const signatureVerifier = new Signatures({
        message: {
          publicKeysPath: `${__dirname}/test-public-keys`
        }
      });

      const keyName = "public-message-key";

      expect(signatureVerifier.verifyMessage(signedMessage, keyName)).to.be.true;
    });
  });
});
