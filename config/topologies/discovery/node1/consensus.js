module.exports = {
  "name": `${require('os').hostname()}-consensus`,
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51154",
  "project": "consensus-service-typescript",
  "peers": [
    {
      "service": "gossip",
      "endpoint": "0.0.0.0:51153"
    },
    {
      "service": "virtual-machine",
      "endpoint": "0.0.0.0:51155"
    },
    {
      "service": "block-storage",
      "endpoint": "0.0.0.0:51157"
    }
  ]
}
