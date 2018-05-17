package com.orbs.client;

import com.google.gson.annotations.SerializedName;

public class SendTransactionSignature {
  @SerializedName("publicKeyHex")
  public String publicKeyHex;
  @SerializedName("signatureHex")
  public String signatureHex;
}
