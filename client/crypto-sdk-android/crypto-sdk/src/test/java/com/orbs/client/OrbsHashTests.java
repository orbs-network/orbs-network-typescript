package com.orbs.client;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.junit.Assert;

import org.junit.Test;

import java.util.Arrays;

import static org.junit.Assert.*;

public class OrbsHashTests {

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



  @Test
  public void test_hash256() {
    final String KUKU_HASH = "81A50432934AF4642227A1561BF0DC3ABA0F4B82F904C11E12E82F61E034F2DA";
    final byte[] KUKU_HASH_BYTES = {-127, -91, 4, 50, -109, 74, -12, 100, 34, 39, -95, 86, 27, -16, -36, 58, -70, 15, 75, -126, -7, 4, -63, 30, 18, -24, 47, 97, -32, 52, -14, -38};
    try {
      byte[] kukuHash = OrbsHashUtils.hash256("kuku");
      Assert.assertArrayEquals(KUKU_HASH_BYTES, kukuHash);
    }
    catch (Exception ex) {
      Assert.fail();
    }
  }
}