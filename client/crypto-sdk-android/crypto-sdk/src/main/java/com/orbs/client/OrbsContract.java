package com.orbs.client;

import org.json.JSONStringer;


public class OrbsContract {
  private final OrbsHttpClient client;
  private final String contractName;

  public OrbsContract(OrbsHttpClient client, String contractName) {
    this.client = client;
    this.contractName = contractName;
  }

  public Object sendTransaction(String methodName, Object[] args) throws Exception {
    String jsonPayload = new JSONStringer().object()
        .key("method")
        .value(methodName)
        .key("args")
        .value(args)
        .endArray().toString();

    return client.sendHTTPRequest("/public/sendTransaction", jsonPayload);
  }

  public Object call(String methodName, Object[] args) {
    Object output = new Object();
    return "some-answer";
  }
}
