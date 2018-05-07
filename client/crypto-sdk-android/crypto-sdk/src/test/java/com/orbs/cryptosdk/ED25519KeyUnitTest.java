package com.orbs.cryptosdk;

import org.junit.Test;

import java.nio.Buffer;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class ED25519KeyUnitTest {
    static {
        CryptoSDK.initialize();
    }

    @Test
    public void is_properly_initialized_by_a_public_key() {
        String publicKey = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65";
        ED25519Key key = new ED25519Key(publicKey);

        assertEquals(key.getPublicKey(), publicKey);
        assertFalse(key.hasPrivateKey());
    }

    @Test
    public void is_properly_initialized_by_a_public_and_private_keys() {
        String publicKey = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b";
        String privateKey = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";
        ED25519Key key = new ED25519Key(publicKey, privateKey);

        assertEquals(key.getPublicKey(), publicKey);
        assertEquals(key.getPrivateKeyUnsafe(), privateKey);
        assertTrue(key.hasPrivateKey());
    }

    @Test
    public void is_randomly_generated() {
        ED25519Key key1 = new ED25519Key();

        assertEquals(key1.getPublicKey().length(), 64);
        assertTrue(key1.hasPrivateKey());

        ED25519Key key2 = new ED25519Key();

        assertEquals(key2.getPublicKey().length(), 64);
        assertTrue(key2.hasPrivateKey());

        assertNotEquals(key1.getPublicKey(), key2.getPublicKey());
    }

    @Test
    public void signs_and_verifies_messages() {
        byte[] message1 = "Hello World!".getBytes(StandardCharsets.UTF_8);
        ED25519Key key1 = new ED25519Key();
        byte[] signature1 = key1.sign(message1);

        assertTrue(key1.verify(message1, signature1));

        byte[] message2 = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.".getBytes(StandardCharsets.UTF_8);
        ED25519Key key2 = new ED25519Key();
        byte[] signature2 = key2.sign(message2);

        assertTrue(key2.verify(message2, signature2));

        assertFalse(key1.verify(message2, signature1));
        assertFalse(key1.verify(message1, signature2));
        assertFalse(key1.verify(message2, signature2));
        assertFalse(key2.verify(message2, signature1));
        assertFalse(key2.verify(message1, signature2));
        assertFalse(key2.verify(message1, signature1));
    }
}
