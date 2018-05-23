import hashlib
import json
from time import time
from math import floor

class HttpClient:
  def __init__(self, endpoint, address, key_pair, timeout_in_millis=3000):
    self.endpoint = endpoint
    self.address = address
    self.key_pair = key_pair
    self.timeout_in_millis = timeout_in_millis


  def send_transaction(self, contract_address, payload):
    import requests

    transaction = self.generate_transaction_request(contract_address, payload)

    request = requests.post(self.endpoint + '/public/sendTransaction', json=transaction)
    response = request.json()

    return response['result']


  def call(self, contract_address, payload):
    import requests

    call_data = self.generate_call_request(contract_address, payload)

    request = requests.post(self.endpoint + '/public/callContract', json=call_data)
    response = request.json()

    return response['result']


  def get_transaction_status(txid):
    import requests

    request = requests.post(self.endpoint + 'public/getTransactionStatus', json={'txid': txid})
    response = request.json()

    return response


  def generate_transaction_request(self, contract_address, payload, timestamp = time()):
    # build transaction without signatute data
    header = {
      'version': 0,
      'senderAddressBase58': self.address.to_string(),
      'timestamp': json.dumps(int(timestamp * 1000)),
      'contractAddressBase58': contract_address.to_string()
    }

    tx_hash = hashlib.sha256(json.dumps({'header': header, 'payload': payload}, sort_keys=True, separators=(',', ':'))).digest()
    signature_hex =  self.key_pair.sign(tx_hash)

    req = {
      'header': header,
      'payload': payload,
      'signatureData': {
        'publicKeyHex': self.key_pair.public_key,
        'signatureHex': signature_hex
      }
    }

    return req


  def generate_call_request(self, contract_address, payload):
    req = {
      'senderAddressBase58': self.address.to_string(),
      'contractAddressBase58': contract_address.to_string(),
      'payload': payload
    }

    return req
