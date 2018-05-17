package com.orbs.client;

import com.google.gson.annotations.SerializedName;

public class CallContractRequest {
  @SerializedName("senderAddressBase58")
  public String senderAddressBase58;
  @SerializedName("contractAddressBase58")
  public String contractAddressBase58;
  @SerializedName("payload")
  public String payload;
}
