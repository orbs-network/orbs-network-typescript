const java = require("java");
java.options.push("-Djava.library.path=../crypto-sdk-android/crypto-sdk/build/outputs/jar/");
java.classpath.push("../crypto-sdk-android/crypto-sdk/build/outputs/jar/crypto-sdk-release.jar");

export function createJavaOrbsContract(contractName: string, apiEndpoint: string, senderPublicKey: string,
                                       virtualChainId: string, networkId: string, timeout: number) {

  const Address = java.import("com.orbs.cryptosdk.Address");
  const OrbsHttpClient = java.import("com.orbs.client.OrbsHttpClient");
  const OrbsContract = java.import("com.orbs.client.OrbsContract");

  const address = new Address(senderPublicKey, virtualChainId, networkId);
  const client = new OrbsHttpClient(apiEndpoint, address, timeout);

  return new OrbsContract(client, contractName);
}


