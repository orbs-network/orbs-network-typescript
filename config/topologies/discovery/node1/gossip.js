module.exports = {
  "name": `${require('os').hostname()}-block-gossip`,
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51153",
  "project": "gossip-service-typescript",
  "peers": [
    {
      "service": "public-api",
      "endpoint": "0.0.0.0:51151"
    },
    {
      "service": "consensus",
      "endpoint": "0.0.0.0:51154"
    }
  ],
  "gossipPort": "60001",
  "gossipPeers": ["172.1.1.1", "172.1.1.2", "172.1.1.3", "172.1.1.4", "172.1.1.5", "172.1.1.6"],
  "global": true
}
