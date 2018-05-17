package com.orbs.client;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.junit.Test;

import static org.junit.Assert.*;

public class OrbsStableTransactionRequestSerializerTest {

  final String EXPECTED_REQUEST_JSON = "{\"header\":{\"contractAddressBase58\":\"abc\",\"senderAddressBase58\":\"zxc\",\"timestamp\":\"123\",\"version\":0},\"payload\":\"{some: json}\"}";


  @Test
  public void serialize_request_for_hash() {
    SendTransactionRequest req = new SendTransactionRequest();
    req.header = new SendTransactionHeader();
    req.header.version = 0;
    req.header.contractAddressBase58 = "abc";
    req.header.timestamp = "123";
    req.header.senderAddressBase58 = "zxc";
    req.payload = "{some: json}";

    Gson gson = new GsonBuilder().registerTypeAdapter(SendTransactionRequest.class, new OrbsStableTransactionRequestSerializer()).create();

    String res = gson.toJson(req);
    assertEquals(res, EXPECTED_REQUEST_JSON);
  }
}