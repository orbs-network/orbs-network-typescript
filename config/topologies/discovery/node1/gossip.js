const NAME = process.env.NODE_NAME || process.env.NODE_IP || require('os').hostname();
const GOSSIP_PEERS = process.env.GOSSIP_PEERS ? process.env.GOSSIP_PEERS.split(',') : undefined;

module.exports = {
  "name": `${NAME}-block-gossip`,
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
  "gossipPeers": GOSSIP_PEERS || [
    "ws://172.1.1.2:60001",
    "ws://172.1.1.3:60001",
    "ws://172.1.1.4:60001",
    "ws://172.1.1.5:60001",
    "ws://172.1.1.6:60001",
    "ws://172.1.1.7:60001"
  ]
}
