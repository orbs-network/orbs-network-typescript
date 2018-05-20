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
  const OrbsClient = java.import("com.orbs.client.OrbsClient");
  const OrbsContract = java.import("com.orbs.client.OrbsContract");

  const senderAddress = new Address(senderPublicKey, virtualChainId, networkId);
  const keyPair = new ED25519Key(senderPublicKey, senderPrivateKey);
  const client = new OrbsClient(apiEndpoint, senderAddress, keyPair, timeout);

  return new OrbsContract(client, contractName);
}


