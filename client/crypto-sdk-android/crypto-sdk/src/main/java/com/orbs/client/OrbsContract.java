package com.orbs.client;

public class OrbsContract {
  private final OrbsHttpClient client;
  private final String contractName;

  public OrbsContract(OrbsHttpClient client, String contractName) {
      this.client = client;
      this.contractName = contractName;
  }

  public Object sendTransaction(String methodName, Object[] args) {
    Object output = new Object();
    return "ok";
  }

  public Object call(String methodName, Object[] args) {
      Object output = new Object();
      return "some-answer";
  }
}
