module.exports = {
  "name": "public-api",
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51151",
  "project": "public-api-service-typescript",
  "peers": [
    {
      "service": "gossip",
      "endpoint": "gossip:51151"
    },
    {
      "service": "consensus",
      "endpoint": "consensus:51151"
    },
    {
      "service": "virtual-machine",
      "endpoint": "virtual-machine:51151"
    }
  ]
}
