#!/usr/bin/env python

import unittest

from os import sys, path
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from orbs_client.pycrypto import ED25519Key


class TestED25519Key(unittest.TestCase):
    def test_initialized_by_a_public_key(self):
        public_key1 = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"

        key1 = ED25519Key(public_key1)
        self.assertEqual(key1.public_key, public_key1)
        self.assertFalse(key1.has_private_key)

        public_key2 = "7a463487bb0eb584dabccd52398506b4a2dd432503cc6b7b582f87832ad104e6"
        key2 = ED25519Key(public_key2)
        self.assertEqual(key2.public_key, public_key2)
        self.assertFalse(key2.has_private_key)

    def test_initialized_by_a_public_key_and_private_key(self):
        public_key1 = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"
        private_key1 = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"

        key1 = ED25519Key(public_key1, private_key1)
        self.assertEqual(key1.public_key, public_key1)
        self.assertEqual(key1.unsafe_private_key, private_key1)
        self.assertTrue(key1.has_private_key)

        public_key2 = "f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3"
        private_key2 = "031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935"

        key2 = ED25519Key(public_key2, private_key2)
        self.assertEqual(key2.public_key, public_key2)
        self.assertEqual(key2.unsafe_private_key, private_key2)
        self.assertTrue(key2.has_private_key)

    def test_is_randomly_generated(self):
        key1 = ED25519Key()
        key2 = ED25519Key()
        key3 = ED25519Key()

        self.assertEqual(len(key1.public_key), 64)
        self.assertEqual(len(key1.unsafe_private_key), 64)
        self.assertTrue(key1.has_private_key)

        self.assertEqual(len(key2.public_key), 64)
        self.assertEqual(len(key2.unsafe_private_key), 64)
        self.assertTrue(key2.has_private_key)

        self.assertEqual(len(key3.public_key), 64)
        self.assertEqual(len(key3.unsafe_private_key), 64)
        self.assertTrue(key3.has_private_key)

        self.assertNotEqual(key1.public_key, key2.public_key)
        self.assertNotEqual(key2.public_key, key3.public_key)

    def test_can_sign_and_verify_messages(self):
        message1 = "Hello World!"
        public_key1 = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"
        private_key1 = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"
        key1 = ED25519Key(public_key1, private_key1)
        signature1 = key1.sign(message1)
        self.assertTrue(key1.verify(message1, signature1))

        message2 = "If I sign myself Jean-Paul Sartre it is not the same thing as if I sign myself Jean - Paul Sartre, Nobel Prize winner."
        public_key2 = "f1e8935355da72309ffdfd4ec62b6f48abf8f690dc29abf77badc4b83596aab3"
        private_key2 = "031f72d5fd7a518458f6e4d14fdcc8c28dedccef4b700f6351cd42ca84a7b935"
        key2 = ED25519Key(public_key2, private_key2)
        signature2 = key2.sign(message2)
        self.assertTrue(key2.verify(message2, signature2))

        self.assertFalse(key1.verify(message2, signature1))
        self.assertFalse(key1.verify(message1, signature2))
        self.assertFalse(key1.verify(message2, signature2))
        self.assertFalse(key2.verify(message2, signature1))
        self.assertFalse(key2.verify(message1, signature2))
        self.assertFalse(key2.verify(message1, signature1))


if __name__ == '__main__':
    unittest.main()
