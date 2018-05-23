class Contract:
  def __init__(self, http_client, name):
    self.http_client = http_client
    self.name = name

  def send_transaction(method_name, *args):
    return "nok"

  def call(method_name, *args):
    return "nok"
