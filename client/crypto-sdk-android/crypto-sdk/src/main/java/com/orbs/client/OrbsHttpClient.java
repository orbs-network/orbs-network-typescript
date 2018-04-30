package com.orbs.client;

import com.orbs.cryptosdk.Address;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.stream.Collectors;

public class OrbsHttpClient {
  final String apiEndpoint;
  final Address address;
  final int timeout;

  public OrbsHttpClient(String apiEndpoint, Address address) {
    this.apiEndpoint = apiEndpoint;
    this.address = address;
    this.timeout = 2000;
  }

  public OrbsHttpClient(String apiEndpoint, Address address, Integer timeout) {
    this.apiEndpoint = apiEndpoint;
    this.address = address;
    this.timeout = timeout;
  }

  public String sendHTTPRequest(String path, String jsonPayload) throws Exception {
    URL url = new URL(this.apiEndpoint);
    HttpURLConnection connection = (HttpURLConnection) url.openConnection();

    connection.setConnectTimeout(this.timeout);
    connection.setReadTimeout(this.timeout);
    connection.setRequestMethod("POST");
    connection.setRequestProperty("Content-Type", "application/json");
    connection.setDoOutput(true);

    DataOutputStream out = new DataOutputStream(connection.getOutputStream());
    out.writeUTF(jsonPayload);
    out.flush();
    out.close();

    BufferedReader buffer = new BufferedReader(new InputStreamReader(connection.getInputStream()));
    String result = buffer.lines().collect(Collectors.joining("\n"));

    connection.disconnect();

    return result;
  }
}
