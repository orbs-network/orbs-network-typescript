package com.orbs.client;

import com.google.gson.annotations.SerializedName;

public class SendTransactionHeader {
  @SerializedName("version")
  public int version;
  @SerializedName("senderAddressBase58")
  public String senderAddressBase58;
  @SerializedName("timestamp")
  public String timestamp;
  @SerializedName("contractAddressBase58")
  public String contractAddressBase58;
}
