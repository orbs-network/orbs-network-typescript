import hashlib
import json
from pycrypto import Address

class Contract:
  def __init__(self, http_client, name):
    self.http_client = http_client
    self.name = name
    self.contract_key = hashlib.sha256(name).hexdigest()
    self.address = Address(self.contract_key, self.http_client.address.virtual_chain_id, self.http_client.address.network_id)


  def send_transaction(self, method_name, *args):
    payload = self.generate_payload(method_name, args)
    return self.http_client.send_transaction(self.address, payload);


  def call(self, method_name, *args):
    payload = this.generate_payload(method_name, args)
    return self.http_client.call(self.address, payload)


  def generate_payload(self, methodName, args):
    args_to_use = args

    if not args:
      args_to_use = []

    return json.dumps({
      'method': methodName,
      'args': args_to_use
    })
