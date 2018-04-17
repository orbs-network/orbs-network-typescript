package com.orbs.client;

public class OrbsContract {

  private final OrbsHttpClient client;
  private final String contractName;

  public Future<SendTransactionOutput> sendTransaction(String methodName, Object[] args) {
  }

  public Future<Object> call(String methodName, Object[] args) {
  }
}
