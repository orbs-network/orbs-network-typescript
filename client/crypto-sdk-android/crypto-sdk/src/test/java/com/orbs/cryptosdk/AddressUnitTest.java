package com.orbs.cryptosdk;

import org.junit.Test;

import static org.junit.Assert.*;

public class AddressUnitTest {
    @Test
    public void converts_address_to_string() {
        Address address = new Address("8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65", "640ed3", "M");

        assertEquals(address.toString(), "M1EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4QFsJu1");
    }
}
