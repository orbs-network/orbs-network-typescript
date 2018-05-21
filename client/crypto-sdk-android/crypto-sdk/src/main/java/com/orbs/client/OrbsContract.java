package com.orbs.client;


import com.google.gson.Gson;
import com.orbs.cryptosdk.Address;

public class OrbsContract {
  private final OrbsClient orbsClient;
  private final Address contractAddress;

  public OrbsContract(OrbsClient client, String contractName) throws Exception {
    this.orbsClient = client;
    String contractHash = OrbsHashUtils.bytesToHex(OrbsHashUtils.hash256(contractName));
    this.contractAddress = new Address(contractHash, client.senderAddress.virtualChainId, client.senderAddress.networkId);
  }

  public SendTransactionResponse sendTransaction(String methodName, Object[] args) throws Exception {
    String payload = generateSendTransactionPayload(methodName, args);
    return orbsClient.sendTransaction(this.contractAddress, payload);
  }

  public String call(String methodName, Object[] args) throws Exception {
    String payload = generateCallPayload(methodName, args);
    return orbsClient.call(this.contractAddress, payload);
  }

  public String generateSendTransactionPayload(String methodName, Object[] args) throws Exception {
    SendTransactionPayload payload = new SendTransactionPayload.Builder()
            .withMethod(methodName)
            .withArgs(args)
            .build();
    Gson gson = new Gson();
    return gson.toJson(payload);
  }

  public String generateCallPayload(String methodName, Object[] args) {
    CallPayload payload = new CallPayload();
    payload.method = methodName;
    payload.args = args;
    Gson gson = new Gson();
    return gson.toJson(payload);
  }

  public OrbsClient getOrbsClient() {
    return orbsClient;
  }

  public Address getContractAddress() {
    return contractAddress;
  }
}
