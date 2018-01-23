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
  "global": true
}
