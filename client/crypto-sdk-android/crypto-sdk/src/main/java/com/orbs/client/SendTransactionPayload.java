package com.orbs.client;

import com.google.gson.annotations.SerializedName;

public class SendTransactionPayload {
  @SerializedName("method")
  public String method;
  @SerializedName("args")
  public Object[] args;
}
