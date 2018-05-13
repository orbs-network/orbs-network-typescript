const java = require("java");
java.options.push("-Djava.library.path=../crypto-sdk-android/crypto-sdk/build/outputs/jar/");
java.classpath.push("../crypto-sdk-android/crypto-sdk/build/outputs/jar/crypto-sdk-release.jar");
java.classpath.push("build/javaLibs/okhttp-3.10.0.jar");
java.classpath.push("build/javaLibs/okio-1.14.1.jar");
java.classpath.push("build/javaLibs/gson-2.8.4.jar");

export function createJavaOrbsContract(contractName: string, apiEndpoint: string, senderPublicKey: string,
                                       virtualChainId: string, networkId: string, timeout: number) {

  const Address = java.import("com.orbs.cryptosdk.Address");
  const OrbsClient = java.import("com.orbs.client.OrbsClient");
  const OrbsContract = java.import("com.orbs.client.OrbsContract");

  const senderAddress = new Address(senderPublicKey, virtualChainId, networkId);
  const client = new OrbsClient(apiEndpoint, senderAddress, timeout);

  return new OrbsContract(client, contractName);
}


