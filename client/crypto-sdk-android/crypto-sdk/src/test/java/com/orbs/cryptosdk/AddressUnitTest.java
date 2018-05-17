package com.orbs.cryptosdk;

import org.junit.Test;

import static org.junit.Assert.*;

public class AddressUnitTest {
    static {
        CryptoSDK.initialize();
    }

    @Test
    public void converts_address_to_string() {
        String publicKey = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65";

        try (Address address = new Address(publicKey, "640ed3", "M")) {
            assertEquals(address.toString(), "M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qqa1");
            assertEquals(address.getPublicKey(), publicKey);
        }
    }

    @Test
    public void throws_on_invalid_arguments_converts_address_to_string() {
        try (Address address = new Address(null, "640ed3", "M")) {
        } catch (Exception e) {
            assertEquals(e.getMessage(), "Invalid arguments!");
        }

        try (Address address = new Address("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65", null, "M")) {
        } catch (Exception e) {
            assertEquals(e.getMessage(), "Invalid arguments!");
        }

        try (Address address = new Address("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65", "640ed3", null)) {
        } catch (Exception e) {
            assertEquals(e.getMessage(), "Invalid arguments!");
        }
    }
}
