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
