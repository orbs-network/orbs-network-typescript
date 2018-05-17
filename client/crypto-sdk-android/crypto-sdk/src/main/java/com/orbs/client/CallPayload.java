package com.orbs.client;

import com.google.gson.annotations.SerializedName;

public class CallPayload {
  @SerializedName("method")
  public String method;
  @SerializedName("args")
  public Object[] args;
}
