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
    String contractHash = hash256(contractName);
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

  public static String hash256(String data) throws NoSuchAlgorithmException {
    MessageDigest md = MessageDigest.getInstance("SHA-256");
    md.update(data.getBytes());
    return bytesToHex(md.digest());
  }

  public static String bytesToHex(byte[] bytes) {
    StringBuffer result = new StringBuffer();
    for (byte byt : bytes) result.append(Integer.toString((byt & 0xff) + 0x100, 16).substring(1));
    return result.toString();
  }

  public OrbsClient getOrbsClient() {
    return orbsClient;
  }

  public Address getContractAddress() {
    return contractAddress;
  }
}
