package com.orbs.client;


import com.orbs.cryptosdk.Address;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class OrbsContract {
  private final OrbsHttpClient client;
  private final Address contractAddress;

  public OrbsContract(OrbsHttpClient client, String contractName) throws Exception {
    this.client = client;
    this.contractAddress = new Address(hash256(contractName), client.address.virtualChainId, client.address.networkId);
  }

  public Object sendTransaction(String methodName, Object[] args) throws Exception {
    StringBuilder escapedArgsBuilder = new StringBuilder();

    for (int i = 0; i < args.length; i++) {
      Object value = args[i] instanceof String ? escapeString((String) args[i]) : args[i];
      escapedArgsBuilder.append(value);

      if (i != args.length - 1) {
        escapedArgsBuilder.append(",");
      }
    }

    String jsonPayload = "{" +
        escapeString("method") + ":" + escapeString(methodName) + "," +
        escapeString("args") + ":[" + escapedArgsBuilder.toString() + "]" +
        "}";

    String sendTransactionPayload = prepareSendTransactionJSON(jsonPayload);
    System.out.println(sendTransactionPayload);

    return this.client.sendHTTPRequest("/public/sendTransaction", "{\"message\": \"hello\"}");
  }

  public Object call(String methodName, Object[] args) {
    Object output = new Object();
    return "some-answer";
  }

  public String escapeString(String input) {
    return "\"" + input + "\"";
  }

  private String prepareSendTransactionJSON(String jsonPayload) {
    return "{" +
        "\"header\":" +
        "{" +
        "\"version\": 0," +
        "\"senderAddressBase58\":" + escapeString(this.client.address.toString()) + "," +
        "\"timestamp\":" + System.currentTimeMillis() + "," +
        "\"contractAddressBase58\":" + escapeString(this.contractAddress.toString()) +
        "}," +
        "\"payload\":" + escapeString(escapeQuotes(jsonPayload)) +
        "}";
  }

  private String escapeQuotes(String json) {
    return json.replace("\"", "\\\"");
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
}
