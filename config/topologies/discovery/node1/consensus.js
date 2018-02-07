const NAME = process.env.NODE_NAME || process.env.NODE_IP || require('os').hostname();

module.exports = {
  "name": "consensus",
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51151",
  "project": "consensus-service-typescript",
  "peers": [
    {
      "service": "gossip",
      "endpoint": "gossip:51151"
    },
    {
      "service": "virtual-machine",
      "endpoint": "virtual-machine:51151"
    },
    {
      "service": "block-storage",
      "endpoint": "block-storage:51151"
    }
  ]
}
