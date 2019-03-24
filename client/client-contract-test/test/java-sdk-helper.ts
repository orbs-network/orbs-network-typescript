/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const java = require("java");
java.options.push("-Djava.library.path=../crypto-sdk-android/crypto-sdk/build/outputs/jar/");
java.classpath.push("../crypto-sdk-android/crypto-sdk/build/outputs/jar/crypto-sdk-release.jar");
java.classpath.push("build/javaLibs/okhttp-3.10.0.jar");
java.classpath.push("build/javaLibs/okio-1.14.1.jar");
java.classpath.push("build/javaLibs/gson-2.8.4.jar");

export function createJavaOrbsContract(contractName: string, apiEndpoint: string, senderPublicKey: string, senderPrivateKey: string,
                                       virtualChainId: string, networkId: string, timeout: number) {

  const Address = java.import("com.orbs.cryptosdk.Address");
  const ED25519Key = java.import("com.orbs.cryptosdk.ED25519Key");
  const OrbsHost = java.import("com.orbs.client.OrbsHost");
  const OrbsClient = java.import("com.orbs.client.OrbsClient");
  const OrbsContract = java.import("com.orbs.client.OrbsContract");

  const senderAddress = new Address(senderPublicKey, virtualChainId, networkId);
  const keyPair = new ED25519Key(senderPublicKey, senderPrivateKey);
  const host = new OrbsHost(false, "localhost", 80);
  const client = new OrbsClient(host, senderAddress, keyPair, timeout);

  return new OrbsContract(client, contractName);
}


