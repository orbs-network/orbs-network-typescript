class HttpClient:
  def __init__(self, endpoint, address, timeout_in_millis):
    self.endpoint = endpoint
    self.address = address
    self.timeout_in_millis = timeout_in_millis
