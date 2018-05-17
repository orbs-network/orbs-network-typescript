package com.orbs.client;


import com.orbs.cryptosdk.Address;
import com.orbs.cryptosdk.CryptoSDK;
import com.orbs.cryptosdk.ED25519Key;

import org.junit.Test;

import static org.junit.Assert.*;


public class ContractUnitTests {
  static {
    CryptoSDK.initialize();
  }

  final String PRIVATE_KEY = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";
  final String PUBLIC_KEY = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b";

  @Test
  public void test_response_parsing() {
    Address address = new Address(PUBLIC_KEY,"640ed3", "T");
    OrbsClient client = new OrbsClient("dont_care", address , new ED25519Key(PUBLIC_KEY, PRIVATE_KEY));
    final String response = "{\"transactionId\": \"some_id\"}";
    SendTransactionResponse res = client.parseSendTransactionResponse(response);
    assertEquals(res.transactionId, "some_id");
  }
}
