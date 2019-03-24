/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as shell from "shelljs";
import { KeyManagerConfig } from "..";

export default function generateKeyPairs(testKit: any): KeyManagerConfig {
  testKit.timeout(4000);

  shell.exec(`
    rm -rf ${__dirname}/test-private-keys
    mkdir -p ${__dirname}/test-private-keys

    rm -rf ${__dirname}/test-public-keys
    mkdir -p ${__dirname}/test-public-keys

    ssh-keygen -t rsa -b 4096 -N "" -f ${__dirname}/test-private-keys/secret-message-key
    ssh-keygen -f ${__dirname}/test-private-keys/secret-message-key.pub -e -m pem > ${__dirname}/test-public-keys/secret-message-key
  `);

  return {
    privateKeyPath: `${__dirname}/test-private-keys/secret-message-key`,
    publicKeysPath: `${__dirname}/test-public-keys`
  };
}
