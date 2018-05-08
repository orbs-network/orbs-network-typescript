package com.orbs.client;

import com.google.gson.Gson;
import com.orbs.cryptosdk.Address;

import java.util.Date;
import java.util.concurrent.TimeUnit;

import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class OrbsClient {
  final String apiEndpoint;
  final Address senderAddress;
  final int timeout;

  public OrbsClient(String apiEndpoint, Address senderAddress) {
    this(apiEndpoint, senderAddress, 2000);
  }

  public OrbsClient(String apiEndpoint, Address senderAddress, Integer timeout) {
    this.apiEndpoint = apiEndpoint;
    this.senderAddress = senderAddress;
    this.timeout = timeout;
  }

  public String sendTransaction(Address contractAddress, String payload) throws Exception {
    String requestJson = generateTransactionRequest(contractAddress, payload);

    return this.sendHTTPRequest(this.apiEndpoint + "/public/sendTransaction", requestJson);
  }

  public String generateTransactionRequest(Address contractAddress, String payload) {
    OrbsAPISendTransactionRequest requestPayload = new OrbsAPISendTransactionRequest();
    requestPayload.payload = payload;
    requestPayload.header = new OrbsAPISendTransactionHeader();
    requestPayload.header.Version = 0;
    requestPayload.header.senderAddressBase58 = this.senderAddress.toString();
    requestPayload.header.timestamp = String.valueOf(new Date().getTime());
    requestPayload.header.contractAddressBase58 = contractAddress.toString();
    Gson gson = new Gson();
    return gson.toJson(requestPayload);
  }

  public String call(Address contractAddress, String payload) throws Exception {
    String requestJson = generateCallRequest(contractAddress, payload);

    return this.sendHTTPRequest(this.apiEndpoint + "/public/callContract", requestJson);
  }

  public String generateCallRequest(Address contractAddress, String payload) {
    OrbsAPICallContractRequest requestPayload = new OrbsAPICallContractRequest();
    requestPayload.payload = payload;
    requestPayload.senderAddressBase58 = this.senderAddress.toString();
    requestPayload.contractAddressBase58 = contractAddress.toString();
    Gson gson = new Gson();
    return gson.toJson(requestPayload);
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

  private String sendHTTPRequest(String path, String jsonPayload) throws Exception {
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

  private void sendHTTPRequest(String path, String jsonPayload, Callback cb) {
    OkHttpClient client = createClient();
    Request request = createRequest(path, jsonPayload);

    client.newCall(request).enqueue(cb);
  }
}
