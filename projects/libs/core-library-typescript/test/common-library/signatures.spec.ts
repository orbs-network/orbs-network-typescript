import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
import { Signatures } from "../../src/common-library";
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

      const correctSignature = "rfAPwBO/6jY/UixQqsB4pIk9gIN9fWRasnijFUUeNenU9D+0FaURdn2Cwhg/45NkrA6CFpRn6cvLSIZlJUB3SVoQnn/yPFV2NcCyFVZUkX/Ya+7hUe+E8d4EkG4ktuAfUtXadMOTp4LlAGUyAuE8dPpInBzUEqfYjyb4O7IgLO+K/SuZ3TpAdsHXzjkrDKaBsksI/q2DsV2Owj2hzyj3UizwHzApjV6aEfitOQC/XgCxzU4yT3ongWeb1P61pZLvAfeR2ayGpS9g26bKhWZNnFZgQCuIwntj0LRepKQjYiVw6JsZInAQyMB4iICa10EcjHjgix+N3T1SzhtLC9PttgNOpWOY9Cbt7vOlVadgl3DepvrLG98Y2MO/rfwRq41eNTtilt4rZ6ujCdSf4r7T3LVNXNo1k5d2ZUais0SYJuO9hdiRogyIocZxctgS7B4WI6BtOfHapfPpL5N6mzP5ifuStzLhaTjKuGz9fz1Cn33ApTFGk/ybsecD0dMPHk/YC5yNcDxdMwXjssmYqdsaqK2VI8sc04TCp1HnI1bziUkUn2rN+IHSdjbBA2y7t45tJip6znb0XF/gSx/8v08jRy9jouxcVDh+ydGmj0JoVpb5CQDuK3yg1vnukOUjfR1M6cZNK90k9DjyelrgSYZcF9fAzl5FRVO8Zsbdjdv0d4o=";

      expect(signatures.signMessage({
        message: "Hello",
        anotherMessage: "world"
      })).to.be.eql(correctSignature);

      expect(signatures.signMessage({
        anotherMessage: "world",
        message: "Hello"
      })).to.be.eql(correctSignature);
    });


  });

  describe("#verifyMessage", () => {
    it("verifies message by public key", () => {
      const signatures = new Signatures({
        message: {
          privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
        }
      });

      const message = {
        message: "Hello",
        anotherMessage: "world"
      };

      const signature = signatures.signMessage(message);

      const signatureVerifier = new Signatures({
        message: {
          publicKeysPath: `${__dirname}/test-public-keys`
        }
      });

      const keyName = "public-message-key";

      expect(signatureVerifier.verifyMessage(message, signature, keyName)).to.be.true;
    });

    it("works with buffers", () => {
      const signatures = new Signatures({
        message: {
          privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`
        }
      });

      const message = Buffer.from([0, 1]);

      const signature = signatures.signMessage(message);

      const signatureVerifier = new Signatures({
        message: {
          publicKeysPath: `${__dirname}/test-public-keys`
        }
      });

      const keyName = "public-message-key";

      expect(signatureVerifier.verifyMessage(message, signature, keyName)).to.be.true;
    });
  });
});
