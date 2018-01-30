const NAME = process.env.NODE_NAME || process.env.NODE_IP || require('os').hostname();

module.exports = {
  "name": `${NAME}-public-api`,
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51151",
  "project": "public-api-service-typescript",
  "peers": [
    {
      "service": "gossip",
      "endpoint": "gossip:51153"
    },
    {
      "service": "consensus",
      "endpoint": "consensus:51154"
    },
    {
      "service": "virtual-machine",
      "endpoint": "virtual-machine:51155"
    }
  ]
}
