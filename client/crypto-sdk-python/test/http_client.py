#!/usr/bin/env python

import unittest
from pycrypto import ED25519Key, Address

from os import sys, path
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from orbs_client import HttpClient


class TestAddress(unittest.TestCase):
    def test_generate_transaction_request(self):
        virtual_chain_id = "640ed3"
        network_id = Address.MAIN_NETWORK_ID

        sender_public_key = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"
        sender_private_key = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"
        key_pair = ED25519Key(sender_public_key, sender_private_key)

        sender_address = Address(sender_public_key, virtual_chain_id, network_id)

        contract_public_key = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"
        contract_address = Address(contract_public_key, virtual_chain_id, network_id)

        payload = "some payload"

        endpoint = "http://localhost"
        http_client = HttpClient(endpoint, sender_address, key_pair)

        req = http_client.generate_transaction_request(contract_address, payload)
        print req

        self.assertEqual(req['header']['version'], 0)
        self.assertEqual(req['header']['senderAddressBase58'], sender_address.to_string())
        self.assertEqual(req['header']['contractAddressBase58'], contract_address.to_string())

        self.assertEqual(req['payload'], payload)

    def test_generate_call_request(self):
        virtual_chain_id = "640ed3"
        network_id = Address.MAIN_NETWORK_ID

        sender_public_key = "b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b"
        sender_private_key = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7"
        key_pair = ED25519Key(sender_public_key, sender_private_key)

        sender_address = Address(sender_public_key, virtual_chain_id, network_id)

        contract_public_key = "8d41d055d00459be37f749da2caf87bd4ced6fafa335b1f2142e0f44501b2c65"
        contract_address = Address(contract_public_key, virtual_chain_id, network_id)

        payload = "some payload"

        endpoint = "http://localhost"
        http_client = HttpClient(endpoint, sender_address, key_pair)

        req = http_client.generate_call_request(contract_address, payload)
        print req

        self.assertEqual(req['senderAddressBase58'], sender_address.to_string())
        self.assertEqual(req['contractAddressBase58'], contract_address.to_string())
        self.assertEqual(req['payload'], payload)

if __name__ == '__main__':
    unittest.main()
