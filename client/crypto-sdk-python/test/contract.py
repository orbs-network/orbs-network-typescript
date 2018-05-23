#!/usr/bin/env python

import unittest
import json
from pycrypto import ED25519Key, Address

from os import sys, path
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from orbs_client import HttpClient, Contract


class TestContract(unittest.TestCase):
    def test_generate_payload(self):
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

        contract = Contract(http_client, "some-contract")

        method = "myMethod"
        args = [1, 2, 3, 7]

        req = json.loads(contract.generate_payload(method, args))
        print req

        self.assertEqual(req['method'], method)
        self.assertEqual(req['args'], args)

        reqWithNoArgs = json.loads(contract.generate_payload(method, None))
        print reqWithNoArgs

        self.assertEqual(reqWithNoArgs['method'], method)
        self.assertEqual(reqWithNoArgs['args'], [])


if __name__ == '__main__':
    unittest.main()
