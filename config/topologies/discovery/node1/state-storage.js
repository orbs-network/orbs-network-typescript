const NAME = process.env.NODE_NAME || process.env.NODE_IP || require('os').hostname();

module.exports = {
  "name": `${NAME}-state-storage`,
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51156",
  "project": "state-storage-service-typescript",
  "peers": [
    {
      "service": "block-storage",
      "endpoint": "block-storage:51157"
    }
  ]
}
