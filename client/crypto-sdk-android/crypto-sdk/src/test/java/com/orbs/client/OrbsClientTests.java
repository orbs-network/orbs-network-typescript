package com.orbs.client;


import com.orbs.cryptosdk.Address;
import com.orbs.cryptosdk.ED25519Key;

import org.junit.Test;

import java.net.URL;

import static org.junit.Assert.assertEquals;


public class OrbsClientTests {

  final String PRIVATE_KEY = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";
  final String PUBLIC_KEY = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b";


  @Test
  public void test_url_building() {
    Address address = new Address(PUBLIC_KEY,"640ed3", "T");
    OrbsHost endpoint = new OrbsHost(false, "some.host.network", 80);
    OrbsClient client = new OrbsClient(endpoint, address , new ED25519Key(PUBLIC_KEY, PRIVATE_KEY));
    URL url = client.buildUrlForRequest("some/path");
    assertEquals(url.toString(), "http://some.host.network/some/path");
  }

  @Test
  public void test_url_building_custom_port() {
    Address address = new Address(PUBLIC_KEY,"640ed3", "T");
    OrbsHost endpoint = new OrbsHost(false, "some.host.network", 3242);
    OrbsClient client = new OrbsClient(endpoint, address , new ED25519Key(PUBLIC_KEY, PRIVATE_KEY));
    URL url = client.buildUrlForRequest("some/path");
    assertEquals(url.toString(), "http://some.host.network:3242/some/path");
  }

  @Test
  public void test_url_building_ssl() {
    Address address = new Address(PUBLIC_KEY,"640ed3", "T");
    OrbsHost endpoint = new OrbsHost(true, "some.host.network", 443);
    OrbsClient client = new OrbsClient(endpoint, address , new ED25519Key(PUBLIC_KEY, PRIVATE_KEY));
    URL url = client.buildUrlForRequest("some/path");
    assertEquals(url.toString(), "https://some.host.network/some/path");
  }

  @Test
  public void test_url_building_ssl_custom_port() {
    Address address = new Address(PUBLIC_KEY,"640ed3", "T");
    OrbsHost endpoint = new OrbsHost(true, "some.host.network", 1443);
    OrbsClient client = new OrbsClient(endpoint, address , new ED25519Key(PUBLIC_KEY, PRIVATE_KEY));
    URL url = client.buildUrlForRequest("some/path");
    assertEquals(url.toString(), "https://some.host.network:1443/some/path");
  }
}
