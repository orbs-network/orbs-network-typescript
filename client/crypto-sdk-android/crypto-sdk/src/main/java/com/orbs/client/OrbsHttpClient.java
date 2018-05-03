package com.orbs.client;

import com.orbs.cryptosdk.Address;

import java.util.concurrent.TimeUnit;

import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

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

  private OkHttpClient createClient() {
    return new OkHttpClient.Builder()
            .readTimeout(2, TimeUnit.SECONDS)
            .build();
  }

  private Request createRequest(String path, String jsonPayload) {
    MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    RequestBody body = RequestBody.create(JSON, jsonPayload);
    return new Request.Builder()
            .url(this.apiEndpoint + path)
            .post(body)
            .build();
  }

  public String sendHTTPRequest(String path, String jsonPayload) throws Exception {
    System.out.println(this.apiEndpoint + path);

    OkHttpClient client = createClient();
    Request request = createRequest(path, jsonPayload);

    Response res = client.newCall(request).execute();
    if (res.isSuccessful()) {
      return res.body().string();
    }
    else {
      throw new Exception("Request failed " + res.code());
    }
  }

  public void sendHTTPRequest(String path, String jsonPayload, Callback cb) {
    OkHttpClient client = createClient();
    Request request = createRequest(path, jsonPayload);

    client.newCall(request).enqueue(cb);
  }
}
