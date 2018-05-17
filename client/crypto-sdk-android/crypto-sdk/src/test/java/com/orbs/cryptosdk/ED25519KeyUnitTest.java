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

        try (ED25519Key key = new ED25519Key(publicKey)) {
            assertEquals(key.getPublicKey(), publicKey);
            assertFalse(key.hasPrivateKey());
        }
    }

    @Test
    public void throws_on_invalid_arguments_is_properly_initialized_by_a_public_key() {
        try (ED25519Key key = new ED25519Key(null)) {
        } catch (Exception e) {
            assertEquals(e.getMessage(), "Invalid argument!");
        }

        String publicKey = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b";
        String privateKey = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";

        try (ED25519Key key = new ED25519Key(null, privateKey)) {
        } catch (Exception e) {
            assertEquals(e.getMessage(), "Invalid arguments!");
        }

        try (ED25519Key key = new ED25519Key(publicKey, null)) {
        } catch (Exception e) {
            assertEquals(e.getMessage(), "Invalid arguments!");
        }

        try (ED25519Key key = new ED25519Key(null, null)) {
        } catch (Exception e) {
            assertEquals(e.getMessage(), "Invalid arguments!");
        }
    }

    @Test
    public void is_randomly_generated() {
        try (ED25519Key key1 = new ED25519Key();
             ED25519Key key2 = new ED25519Key()) {
            assertEquals(key1.getPublicKey().length(), 64);
            assertTrue(key1.hasPrivateKey());

            assertEquals(key2.getPublicKey().length(), 64);
            assertTrue(key2.hasPrivateKey());

            assertNotEquals(key1.getPublicKey(), key2.getPublicKey());
        }
    }

    @Test
    public void can_be_generated_multiple_times() {
        for (int i = 0; i< 100; ++i) {
            try (ED25519Key key = new ED25519Key()) {
                assertEquals(key.getPublicKey().length(), 64);
                assertTrue(key.hasPrivateKey());
            }
        }
    }

    @Test
    public void signs_and_verifies_messages() {
        try (ED25519Key key1 = new ED25519Key();
             ED25519Key key2 = new ED25519Key()) {
            byte[] message1 = "Hello World!".getBytes(StandardCharsets.UTF_8);
            byte[] signature1 = key1.sign(message1);

            assertTrue(key1.verify(message1, signature1));

            byte[] message2 = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean-Paul Sartre, Nobel Prize winner.".getBytes(StandardCharsets.UTF_8);
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

    @Test
    public void throws_on_invalid_arguments_signs_and_verifies_messages() {
        try (ED25519Key key1 = new ED25519Key();
             ED25519Key key2 = new ED25519Key()) {
            byte[] message1 = "Hello World!".getBytes(StandardCharsets.UTF_8);

             try {
                key1.sign(null);
            } catch (Exception e) {
                assertEquals(e.getMessage(), "Invalid argument!");
            }

            byte[] signature1 = key1.sign(message1);

            try {
                key1.verify(null, signature1);
            } catch (Exception e) {
                assertEquals(e.getMessage(), "Invalid arguments!");
            }
            try {
                key1.verify(message1, null);
            } catch (Exception e) {
                assertEquals(e.getMessage(), "Invalid arguments!");
            }
        }
    }
}
