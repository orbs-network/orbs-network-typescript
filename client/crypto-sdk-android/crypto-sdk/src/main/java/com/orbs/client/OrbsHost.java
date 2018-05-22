package com.orbs.client;

public class OrbsHost {
  private String scheme;
  private String host;
  private int port;

  public OrbsHost(boolean isHttps, String host, int port) {
    this.scheme = isHttps ? "https" : "http";
    this.host = host;
    this.port = port;
  }

  public String getScheme() {
    return scheme;
  }

  public String getHost() {
    return host;
  }

  public int getPort() {
    return port;
  }
}
