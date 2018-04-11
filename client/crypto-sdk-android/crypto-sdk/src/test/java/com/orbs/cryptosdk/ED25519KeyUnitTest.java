package com.orbs.cryptosdk;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;

public class ED25519KeyUnitTest {
    static {
        CryptoSDK.initialize();
    }

    @Test
    public void is_properly_initialized_by_a_public_key() {
        String publicKey = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65";
        ED25519Key key = new ED25519Key(publicKey);

        assertEquals(key.getPublicKey(), publicKey);
    }

    @Test
    public void is_randomly_generated() {
        ED25519Key key1 = new ED25519Key();

        assertEquals(key1.getPublicKey().length(), 64);

        ED25519Key key2 = new ED25519Key();

        assertEquals(key2.getPublicKey().length(), 64);

        assertNotEquals(key1.getPublicKey(), key2.getPublicKey());
    }
}
