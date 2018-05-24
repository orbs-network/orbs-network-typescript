#!/usr/bin/env python

import unittest
import json

from os import sys, path
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from orbs_client import HttpClient, Contract
from orbs_client.pycrypto import ED25519Key, Address

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

        reqSendTransaction = json.loads(contract.generate_send_transaction_payload(method, args))
        print reqSendTransaction

        self.assertEqual(reqSendTransaction['method'], method)
        self.assertEqual(reqSendTransaction['args'], args)

        reqSendTransactionWithNoArgs = json.loads(contract.generate_send_transaction_payload(method, None))
        print reqSendTransactionWithNoArgs

        self.assertEqual(reqSendTransactionWithNoArgs['method'], method)
        self.assertEqual(reqSendTransactionWithNoArgs['args'], [])

        reqCall = json.loads(contract.generate_send_transaction_payload(method, args))
        print reqCall

        self.assertEqual(reqCall['method'], method)
        self.assertEqual(reqCall['args'], args)

        reqCallWithNoArgs = json.loads(contract.generate_send_transaction_payload(method, None))
        print reqCallWithNoArgs

        self.assertEqual(reqCallWithNoArgs['method'], method)
        self.assertEqual(reqCallWithNoArgs['args'], [])


if __name__ == '__main__':
    unittest.main()
