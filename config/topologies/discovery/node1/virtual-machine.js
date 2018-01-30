const NAME = process.env.NODE_NAME || process.env.NODE_IP || require('os').hostname();

module.exports = {
  "name": `${NAME}-virtual-machine`,
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51155",
  "project": "virtual-machine-service-typescript",
  "peers": [
    {
      "service": "state-storage",
      "endpoint": "state-storage:51156"
    }
  ]
}
