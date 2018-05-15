package com.orbs.client;


import com.google.gson.Gson;
import com.orbs.cryptosdk.Address;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class OrbsContract {
  private final OrbsClient orbsClient;
  private final Address contractAddress;

  public OrbsContract(OrbsClient client, String contractName) throws Exception {
    this.orbsClient = client;
    String contractHash = OrbsHashUtils.bytesToHex(OrbsHashUtils.hash256(contractName));
    this.contractAddress = new Address(contractHash, client.senderAddress.virtualChainId, client.senderAddress.networkId);
  }

  public OrbsAPISendTransactionResponse sendTransaction(String methodName, Object[] args) throws Exception {
    String payload = generateSendTransactionPayload(methodName, args);
    return orbsClient.sendTransaction(this.contractAddress, payload);
  }

  public Object call(String methodName, Object[] args) throws Exception {
    String payload = generateCallPayload(methodName, args);
    return orbsClient.call(this.contractAddress, payload);
  }

  public String generateSendTransactionPayload(String methodName, Object[] args) {
    OrbsAPISendTransactionPayload payload = new OrbsAPISendTransactionPayload();
    payload.method = methodName;
    payload.args = args;
    Gson gson = new Gson();
    return gson.toJson(payload);
  }

  public String generateCallPayload(String methodName, Object[] args) {
    OrbsAPICallPayload payload = new OrbsAPICallPayload();
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
