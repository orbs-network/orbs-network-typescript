package com.orbs.client;

import com.google.gson.annotations.SerializedName;

public class SendTransactionRequest {
  @SerializedName("header")
  public SendTransactionHeader header;
  @SerializedName("payload")
  public String payload;
  @SerializedName("signatureData")
  public SendTransactionSignature signatureData;
}
