module.exports = {
  "name": `${require('os').hostname()}-state-storage`,
  "version": "1.0.0",
  "endpoint": "0.0.0.0:51156",
  "project": "state-storage-service-typescript",
  "peers": [
    {
      "service": "block-storage",
      "endpoint": "0.0.0.0:51157"
    }
  ]
}
