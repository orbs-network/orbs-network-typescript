import requests
import hashlib
import json
from datetime import datetime

class HttpClient:
  def __init__(self, endpoint, address, key_pair, timeout_in_millis=3000):
    self.endpoint = endpoint
    self.address = address
    self.key_pair = key_pair
    self.timeout_in_millis = timeout_in_millis

  def generate_transaction_request(self, contract_address, payload, timestamp = datetime.utcnow()):
    # build transaction without signatute data
    header = {
      'version': 0,
      'senderAddressBase58': self.address.to_string(),
      'timestamp': timestamp.isoformat() + 'Z',
      'contractAddressBase58': contract_address.to_string()
    }

    tx_hash = hashlib.sha256(json.dumps({'header': header, 'payload': payload})).hexdigest()
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
