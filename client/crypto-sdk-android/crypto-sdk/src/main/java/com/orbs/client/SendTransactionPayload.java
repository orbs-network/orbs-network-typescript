package com.orbs.client;

import com.google.gson.annotations.SerializedName;

public class SendTransactionPayload {
  @SerializedName("method")
  public String method;
  @SerializedName("args")
  public Object[] args;

  public SendTransactionPayload(Builder builder) {
    this.method = builder.method;
    this.args = builder.args;
  }

  public static final class Builder {
    public String method;
    public Object[] args;

    public Builder withMethod(String name) {
      this.method = name;
      return this;
    }

    public Builder withArgs(Object[] args) {
      if (args == null) {
        this.args = new Object[0];
      }
      else {
        this.args = args;
      }
      return this;
    }

    public SendTransactionPayload build() throws Exception {
      if (this.method == null || this.args == null) {
        throw new Exception("Payload must have both args and method name");
      }
      return new SendTransactionPayload(this);
    }
  }
}

