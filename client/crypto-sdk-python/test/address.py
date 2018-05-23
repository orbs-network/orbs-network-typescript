#!/usr/bin/env python

import unittest

from os import sys, path
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from orbs_client.pycrypto import Address


class TestAddress(unittest.TestCase):
    def test_initialized_by_a_public_key(self):
        public_key = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"
        virtual_chain_id = "640ed3"
        network_id = Address.MAIN_NETWORK_ID

        address = Address(public_key, virtual_chain_id, network_id)
        self.assertEqual(address.public_key, public_key)
        self.assertEqual(address.network_id, Address.MAIN_NETWORK_ID)
        self.assertEqual(address.version, "\x00")
        self.assertEqual(address.virtual_chain_id, "640ed3")
        self.assertEqual(address.account_id, "c13052d8208230a58ab363708c08e78f1125f488")
        self.assertEqual(address.checksum, "0b4af4d2")
        self.assertEqual(address.to_string(), "M00EXMPnnaWFqRyVxWdhYCgGzpnaL4qBy4N3Qqa1")


if __name__ == '__main__':
    unittest.main()
