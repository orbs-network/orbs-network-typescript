/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { types } from "../../src/common-library/types";
import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { stubInterface } from "ts-sinon";
import BlockBuilder from "../../src/consensus/block-builder";
import { KeyManager, KeyManagerConfig } from "../../src/common-library";
import * as sinon from "sinon";
import * as shell from "shelljs";
import generateKeyPairs from "../../src/test-kit/generate-key-pairs";

chai.use(sinonChai);

describe("KeyManager", () => {
  let keyManagerConfig: KeyManagerConfig;

  before(async function() {
    keyManagerConfig = generateKeyPairs(this);
  });

  describe("#constructor", () => {
    it("fails to instantiate if no keys were passed to constructor", () => {
      expect(() => new KeyManager({})).to.throw("Neither private key nor public keys are provided!");
    });
  });

  describe("#signMessage", () => {
    it("returns a signed object", () => {
      const keyManager = new KeyManager({
        privateKeyPath: keyManagerConfig.privateKeyPath
      });

      expect(keyManager.sign({
        message: "Hello",
        anotherMessage: "world"
      })).not.to.be.empty;
    });

    it("fails if private key is not found", () => {
      expect(() => {
        new KeyManager({
          publicKeysPath: keyManagerConfig.publicKeysPath
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
        privateKeyPath: keyManagerConfig.privateKeyPath
      });

      const message = {
        message: "Hello",
        anotherMessage: "world"
      };

      const signature = keyManager.sign(message);

      const signatureVerifier = new KeyManager({
        publicKeysPath: keyManagerConfig.publicKeysPath
      });

      const keyName = "secret-message-key";

      expect(signatureVerifier.verify(message, signature, keyName)).to.be.true;
    });

    it("works with buffers", () => {
      const keyManager = new KeyManager({
        privateKeyPath: keyManagerConfig.privateKeyPath
      });

      const message = Buffer.from([0, 1]);

      const signature = keyManager.sign(message);

      const signatureVerifier = new KeyManager({
        publicKeysPath: keyManagerConfig.publicKeysPath
      });

      const keyName = "secret-message-key";

      expect(signatureVerifier.verify(message, signature, keyName)).to.be.true;
    });

    it("fails if public key is not found", () => {
      const keyManager = new KeyManager({
        privateKeyPath: keyManagerConfig.privateKeyPath
      });

      const message = {
        message: "Hello",
        anotherMessage: "world"
      };

      const signature = keyManager.sign(message);

      const signatureVerifier = new KeyManager({
        publicKeysPath: keyManagerConfig.publicKeysPath
      });

      const keyName = "fake-message-key";

      expect(() => signatureVerifier.verify(message, signature, keyName)).to.throw("No public key found: fake-message-key");
    });
  });
});
