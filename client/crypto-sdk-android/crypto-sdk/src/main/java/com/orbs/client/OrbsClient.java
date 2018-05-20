package com.orbs.client;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.orbs.cryptosdk.Address;
import com.orbs.cryptosdk.ED25519Key;

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
  final int timeoutInMs;
  final ED25519Key keyPair;

  public OrbsClient(String apiEndpoint, Address senderAddress, ED25519Key keyPair) {
    this(apiEndpoint, senderAddress, keyPair, 2000);
  }

  public OrbsClient(String apiEndpoint, Address senderAddress, ED25519Key keyPair, Integer timeoutInMs) {
    this.apiEndpoint = apiEndpoint;
    this.senderAddress = senderAddress;
    this.keyPair = keyPair;
    this.timeoutInMs = timeoutInMs;
  }

  public SendTransactionResponse sendTransaction(Address contractAddress, String payload) throws Exception {
    String requestJson = generateTransactionRequest(contractAddress, payload);

    String rawRetVal = this.sendHTTPRequest(this.apiEndpoint + "/public/sendTransaction", requestJson);
    return parseSendTransactionResponse(rawRetVal);
  }

  public SendTransactionResponse parseSendTransactionResponse(String jsonResult) {
    Gson gson = new Gson();
    SendTransactionResponse res = gson.fromJson(jsonResult, SendTransactionResponse.class);
    return res;
  }

  public String generateTransactionRequest(Address contractAddress, String payload) throws Exception {
    SendTransactionRequest requestPayload = new SendTransactionRequest();
    requestPayload.payload = payload;
    requestPayload.header = new SendTransactionHeader();
    requestPayload.header.version = 0;
    requestPayload.header.senderAddressBase58 = this.senderAddress.toString();
    requestPayload.header.timestamp = String.valueOf(new Date().getTime());
    requestPayload.header.contractAddressBase58 = contractAddress.toString();

    Gson gsonForHash = new GsonBuilder().registerTypeAdapter(SendTransactionRequest.class, new OrbsStableTransactionRequestSerializer()).create();
    String requestForHash = gsonForHash.toJson(requestPayload);
    byte[] hashBytes = OrbsHashUtils.hash256(requestForHash);
    byte[] signatureBytes = this.keyPair.sign(hashBytes);
    String signatureHex = OrbsHashUtils.bytesToHex(signatureBytes);

    requestPayload.signatureData = new SendTransactionSignature();
    requestPayload.signatureData.publicKeyHex = this.keyPair.getPublicKey();
    requestPayload.signatureData.signatureHex = signatureHex;

    Gson gson = new Gson();
    return gson.toJson(requestPayload);
  }

  public String call(Address contractAddress, String payload) throws Exception {
    String requestJson = generateCallRequest(contractAddress, payload);

    return this.sendHTTPRequest(this.apiEndpoint + "/public/callContract", requestJson);
  }

  public String generateCallRequest(Address contractAddress, String payload) {
    CallContractRequest requestPayload = new CallContractRequest();
    requestPayload.payload = payload;
    requestPayload.senderAddressBase58 = this.senderAddress.toString();
    requestPayload.contractAddressBase58 = contractAddress.toString();
    Gson gson = new Gson();
    return gson.toJson(requestPayload);
  }


  private OkHttpClient createClient() {
    return new OkHttpClient.Builder()
            .readTimeout(this.timeoutInMs, TimeUnit.MILLISECONDS)
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
